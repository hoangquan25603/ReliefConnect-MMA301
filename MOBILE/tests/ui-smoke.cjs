// Actual React Native Web UI + real local API. Use only a seeded demo server.
const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const origin = process.env.APP_URL || "http://127.0.0.1:8081";
const server = process.env.API_URL || "http://127.0.0.1:5092";
const output = path.resolve(__dirname, "../../qa/mobile");
const pictures = path.resolve(__dirname, "../../marketing/screenshots");
fs.mkdirSync(output, { recursive: true });
fs.mkdirSync(pictures, { recursive: true });
const results = [];
const errors = [];
const run = Date.now();
let browser, active;
const btn = (p, name) => p.getByRole("button", { name, exact: true });
const field = (p, name) => p.getByLabel(name, { exact: true });
const tab = (p, name) => p.getByRole("tab", { name: new RegExp(name) });
const visible = (p, text) =>
  p
    .getByText(text, { exact: true })
    .filter({ visible: true })
    .first()
    .waitFor();
async function shot(p, name) {
  await p.screenshot({ path: path.join(pictures, name + ".png") });
}
async function step(name, fn) {
  await fn();
  results.push({ name, passed: true });
  console.log("PASS", name);
}
async function page() {
  const context = await browser.newContext({
    viewport: { width: 412, height: 915 },
    geolocation: { latitude: 16.0544, longitude: 108.2022 },
    permissions: ["geolocation"],
  });
  const p = await context.newPage();
  active = p;
  p.setDefaultTimeout(12000);
  p.on("pageerror", (e) => errors.push(e.message));
  p.on("dialog", (d) => d.accept());
  await p.goto(origin);
  await field(p, "Địa chỉ server").fill(server);
  await btn(p, "Kiểm tra & lưu kết nối").click();
  await field(p, "Email").waitFor();
  return p;
}
async function login(p, email) {
  await field(p, "Email").fill(email);
  await field(p, "Mật khẩu").fill("Relief@123456");
  await btn(p, "Đăng nhập").click();
  await btn(p, "Mở trợ lý AI").waitFor();
}
async function get(p, url) {
  const session = await p.evaluate(() =>
    JSON.parse(sessionStorage.getItem("relief-session-v1")),
  );
  const r = await fetch(server + "/api" + url, {
    headers: { Authorization: "Bearer " + session.accessToken },
  });
  assert.equal(r.status, 200);
  return r.json();
}
(async () => {
  browser = await chromium.launch({
    headless: true,
    ...(process.env.CHROMIUM_PATH
      ? { executablePath: process.env.CHROMIUM_PATH }
      : {}),
  });
  const admin = await page();
  const volunteerEmail = "vol" + run + "@relief.local",
    volunteerName = "Tình nguyện UI " + run;
  await step(
    "Server setup reaches login; invalid credentials stay on login",
    async () => {
      await field(admin, "Email").fill("admin@relief.local");
      await field(admin, "Mật khẩu").fill("wrong-password");
      await btn(admin, "Đăng nhập").click();
      await admin.getByRole("alert").waitFor();
      assert.equal(await field(admin, "Email").count(), 1);
      await login(admin, "admin@relief.local");
      await shot(admin, "home-admin");
    },
  );
  const warehouseName = "Kho demo UI " + run,
    itemName = "Gạo kiểm thử " + run;
  await step("Create warehouse and stock item through native UI", async () => {
    active = admin;
    await tab(admin, "Kho hàng").click();
    await admin
      .getByRole("radio", { name: "Danh sách kho", exact: true })
      .click();
    await btn(admin, "+ Tạo kho").click();
    for (const [k, v] of Object.entries({
      "Tên kho": warehouseName,
      "Địa chỉ": "Đà Nẵng - dữ liệu thử",
      "Điện thoại": "0900000000",
      "Vĩ độ": "16.05",
      "Kinh độ": "108.20",
    }))
      await field(admin, k).fill(v);
    await btn(admin, "Lưu kho").click();
    await visible(admin, "Đã lưu kho hàng.");
    await admin
      .getByRole("radio", { name: "Vật tư & tồn kho", exact: true })
      .click();
    await admin
      .getByRole("radio", { name: warehouseName, exact: true })
      .click();
    await btn(admin, "+ Thêm vật tư").click();
    await field(admin, "Tên vật tư").fill(itemName);
    await admin.getByRole("radio", { name: "Lương thực", exact: true }).click();
    await field(admin, "Đơn vị (kg, chai, hộp…)").fill("kg");
    await field(admin, "Tồn tối thiểu").fill("6");
    await btn(admin, "Lưu vật tư").click();
    await visible(admin, itemName);
    await admin.getByRole("radio", { name: warehouseName, exact: true }).click();
    await visible(admin, itemName);
  });
  await step(
    "Stock in, out, oversell rejection, transfer and transaction history",
    async () => {
      await btn(admin, "Nhập kho").click();
      await field(admin, "Số lượng").fill("12");
      await btn(admin, "Xác nhận nhập kho").click();
      await visible(admin, "Nhập kho thành công.");
      await btn(admin, "Xuất kho").click();
      await field(admin, "Số lượng").fill("99");
      await btn(admin, "Xác nhận xuất kho").click();
      await visible(admin, "Số lượng vượt quá tồn kho hiện tại.");
      await field(admin, "Số lượng").fill("3");
      await btn(admin, "Xác nhận xuất kho").click();
      await visible(admin, "Xuất kho thành công.");
      await btn(admin, "Chuyển kho").click();
      await admin.getByRole("radio").first().click();
      await field(admin, "Số lượng").fill("4");
      await btn(admin, "Xác nhận chuyển kho").click();
      await visible(admin, "Chuyển kho thành công; đã cập nhật cả hai kho.");
      await visible(admin, "5 kg");
      await shot(admin, "inventory");
      await btn(admin, "Lịch sử giao dịch").click();
      await visible(admin, "Chuyển sang kho khác");
      await shot(admin, "inventory-history");
      await btn(admin, "← Quay lại danh sách").click();
      const list = await get(
        admin,
        "/inventory-items?PageSize=100&Search=" + encodeURIComponent(itemName),
      );
      assert.equal(
        list.items.reduce((s, x) => s + x.quantity, 0),
        9,
      );
    },
  );
  await step(
    "AI model status, classification and stock suggestions render",
    async () => {
      await tab(admin, "Trợ lý AI").click();
      await visible(admin, "Sẵn sàng phân tích");
      await btn(admin, "Thiếu nước sạch").click();
      await btn(admin, "Phân tích bằng AI").click();
      await visible(admin, "Kết quả phân tích");
      assert.match(await admin.locator("body").innerText(), /Nước uống/);
      await admin
        .getByText("NHÓM NHU CẦU CHÍNH", { exact: true })
        .scrollIntoViewIfNeeded();
      await shot(admin, "ai-result");
    },
  );
  const requester = await page(),
    email = `ui${run}@relief.local`,
    requestTitle = "Hỗ trợ nước sạch " + run;
  await step("Register requester and keep role-specific tabs", async () => {
    active = requester;
    await btn(requester, "Chưa có tài khoản? Đăng ký").click();
    for (const [k, v] of Object.entries({
      "Họ và tên": "Người dùng kiểm thử",
      "Số điện thoại": "0900000001",
      Email: email,
      "Mật khẩu": "Relief@123456",
      "Xác nhận mật khẩu": "Relief@123456",
    }))
      await field(requester, k).fill(v);
    await btn(requester, "Đăng ký").click();
    await btn(requester, "Mở trợ lý AI").waitFor();
    assert.equal(await tab(requester, "Kho hàng").count(), 0);
  });
  await step(
    "Request draft, mocked GPS, image picker and server submission",
    async () => {
      await tab(requester, "Yêu cầu").click();
      await btn(requester, "+ Tạo yêu cầu hỗ trợ").click();
      for (const [k, v] of Object.entries({
        "Tiêu đề": requestTitle,
        "Mô tả tình hình":
          "Khu dân cư thiếu nước uống sạch sau ngập lụt. Đây là dữ liệu thử nghiệm.",
        "Địa chỉ": "Đà Nẵng",
        "Tỉnh / khu vực": "Đà Nẵng",
        "Số điện thoại liên hệ": "0900000001",
        "Số người cần hỗ trợ": "2",
        "Nước uống": "2",
      }))
        await field(requester, k).fill(v);
      await btn(requester, "Lấy vị trí hiện tại").click();
      await field(requester, "Vĩ độ").waitFor();
      await requester.waitForFunction(
        () =>
          document.querySelector('[aria-label="Vĩ độ"]').value === "16.0544",
      );
      const chooser = requester.waitForEvent("filechooser");
      await btn(requester, "Chọn ảnh").click();
      await (
        await chooser
      ).setFiles(
        path.resolve(__dirname, "../../marketing/reliefconnect-logo.png"),
      );
      await btn(requester, "Gỡ ảnh").waitFor();
      await btn(requester, "Lưu bản nháp trên máy").click();
      await visible(
        requester,
        "Đã lưu bản nháp trên máy. Chưa gửi đến điều phối viên.",
      );
      const drafts = await requester.evaluate(() =>
        Object.keys(localStorage).filter((k) => k.includes("relief-draft")),
      );
      assert.equal(drafts.length, 1);
      await btn(requester, "Gửi yêu cầu").click();
      await visible(requester, requestTitle);
      const list = await get(requester, "/relief-requests");
      assert.equal(list.items[0].title, requestTitle);
      assert.ok(list.items[0].photoDataUrl.startsWith("data:image/"));
      await shot(requester, "request-created");
    },
  );
  await step("Admin approval and volunteer assignment", async () => {
    active = admin;
    const session = await admin.evaluate(() =>
      JSON.parse(sessionStorage.getItem("relief-session-v1")),
    );
    const created = await fetch(server + "/api/admin/users", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + session.accessToken,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: volunteerEmail,
        fullName: volunteerName,
        password: "Relief@123456",
        roleName: "Volunteer",
      }),
    });
    assert.equal(created.status, 200);
    await tab(admin, "Yêu cầu").click();
    await visible(admin, requestTitle);
    await btn(admin, "Duyệt yêu cầu").first().click();
    await visible(admin, "Cấp phát tại thời điểm duyệt");
    await tab(admin, "Tiện ích").click();
    await btn(admin, "Phân công & tiến độ").click();
    await admin.getByRole("radio", { name: requestTitle, exact: true }).click();
    await admin
      .getByRole("radio", { name: volunteerName, exact: true })
      .click();
    await btn(admin, "Tạo phân công").click();
    await visible(admin, requestTitle);
  });
  const volunteer = await page();
  await step(
    "Volunteer login and complete assigned task in valid order",
    async () => {
      active = volunteer;
      await login(volunteer, volunteerEmail);
      await tab(volunteer, "Nhiệm vụ").click();
      await visible(volunteer, requestTitle);
      await btn(volunteer, "Nhận nhiệm vụ").click();
      await btn(volunteer, "Bắt đầu di chuyển").click();
      await visible(volunteer, "Đang di chuyển");
      await shot(volunteer, "volunteer-task");
      await btn(volunteer, "Xác nhận hoàn thành").click();
      await visible(volunteer, "Hoàn thành");
    },
  );
  const org = await page();
  const donationName = "Nước đóng chai UI " + run;
  await step("Organization creates donation", async () => {
    active = org;
    await login(org, "organization@relief.local");
    await btn(org, "Quản lý quyên góp").click();
    await field(org, "Tên vật tư").fill(donationName);
    await field(org, "Đơn vị").fill("chai");
    await field(org, "Số lượng").fill("7");
    await btn(org, "Gửi quyên góp").click();
    await org.getByText(donationName + ": 7 chai", { exact: true }).waitFor();
  });
  const coordinator = await page();
  await step("Coordinator receives donation into stock", async () => {
    active = coordinator;
    await login(coordinator, "warehouse@relief.local");
    assert.equal(await tab(coordinator, "Yêu cầu").count(), 0);
    await tab(coordinator, "Tiện ích").click();
    await btn(coordinator, "Quyên góp vật tư").click();
    await coordinator
      .getByRole("radio", { name: warehouseName, exact: true })
      .click();
    await btn(coordinator, "Tiếp nhận vào kho").first().click();
    await coordinator
      .getByText(donationName + ": 7 chai", { exact: true })
      .waitFor({ state: "hidden" });
    const found = await get(
      coordinator,
      "/inventory-items?PageSize=100&Search=" +
        encodeURIComponent(donationName),
    );
    assert.equal(found.items[0].quantity, 7);
  });
  await step(
    "Notifications, account profile, admin lists, session reload and logout",
    async () => {
      active = admin;
      await admin
        .getByLabel("Quay lại, back", { exact: true })
        .first()
        .click()
        .catch(() => {});
      await tab(admin, "Tiện ích").click();
      for (const title of [
        "Thông báo",
        "Tài khoản & mật khẩu",
        "Người dùng",
        "Duyệt tình nguyện viên",
        "Duyệt nguyện vọng",
      ]) {
        await btn(admin, title).click();
        await admin.getByRole("heading").first().waitFor();
        await admin
          .getByLabel("Quay lại, back", { exact: true })
          .first()
          .click();
      }
      await admin.reload();
      await btn(admin, "Mở trợ lý AI").waitFor();
      await tab(admin, "Tiện ích").click();
      await btn(admin, "Đăng xuất").click();
      await field(admin, "Email").waitFor();
      assert.equal(
        await admin.evaluate(() => sessionStorage.getItem("relief-session-v1")),
        null,
      );
    },
  );
  await step("No uncaught React runtime errors", async () =>
    assert.deepEqual(errors, []),
  );
  fs.writeFileSync(
    path.join(output, "result.json"),
    JSON.stringify(
      {
        runAt: new Date().toISOString(),
        platform:
          "React Native Web / Chromium 412×915; GPS mocked; no physical Android assertions",
        results,
        errors,
      },
      null,
      2,
    ),
  );
  console.log(`PASSED ${results.length} UI scenarios`);
})()
  .catch(async (e) => {
    console.error(e);
    if (active) {
      console.error(
        (
          await active
            .locator("body")
            .innerText()
            .catch(() => "")
        ).slice(0, 7000),
      );
      await active
        .screenshot({ path: path.join(output, "failure.png") })
        .catch(() => {});
    }
    fs.writeFileSync(
      path.join(output, "result.json"),
      JSON.stringify(
        { runAt: new Date().toISOString(), results, error: e.message, errors },
        null,
        2,
      ),
    );
    process.exitCode = 1;
  })
  .finally(async () => {
    if (browser) await browser.close();
  });

