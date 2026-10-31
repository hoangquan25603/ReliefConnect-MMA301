import React, { useState } from "react";
import { Text, View } from "react-native";
import { useApp } from "../state/AppContext";
import {
  Button,
  Card,
  Field,
  Heading,
  Notice,
  Screen,
  palette,
  styles,
} from "../components/ui";
export function ConnectionScreen({ navigation }: any) {
  const { serverUrl, connect } = useApp();
  const [url, setUrl] = useState(serverUrl || "http://10.0.2.2:5092");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function save() {
    setBusy(true);
    setError("");
    try {
      await connect(url);
      if (navigation.canGoBack()) navigation.goBack();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Screen>
      <Heading
        title="Kết nối máy chủ"
        subtitle="Thiết lập một lần để bắt đầu cùng ReliefConnect."
      />
      <Card>
        <Text style={styles.muted}>
          Mở server trên laptop, sau đó nhập IP của laptop. Điện thoại và laptop
          cần cùng mạng Wi-Fi.
        </Text>
        <Field
          label="Địa chỉ server"
          value={url}
          onChangeText={setUrl}
          keyboardType="url"
          placeholder="http://192.168.1.5:5092"
        />
        <Button title="Kiểm tra & lưu kết nối" loading={busy} onPress={save} />
        <Notice text={error} error />
      </Card>
      <Card>
        <Text style={{ fontWeight: "700", color: palette.navy }}>
          Chọn đúng địa chỉ
        </Text>
        <Text style={styles.muted}>
          Android Emulator: http://10.0.2.2:5092{"\n"}Điện thoại:
          http://IP-LAPTOP:5092{"\n"}Trình duyệt trên laptop:
          http://localhost:5092{"\n"}Hosting: https://ten-mien-cua-nhom
        </Text>
        <Text style={styles.muted}>
          HTTP chỉ dành cho demo trong mạng tin cậy. Khi đổi sang server khác,
          app đăng xuất để không dùng nhầm phiên.
        </Text>
      </Card>
    </Screen>
  );
}
export function LoginScreen({ navigation }: any) {
  const { login, register, serverUrl } = useApp();
  const [mode, setMode] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit() {
    setError("");
    if (
      !email.trim() ||
      !password ||
      (mode && (!name.trim() || password !== confirm))
    ) {
      setError("Kiểm tra email, mật khẩu, tên và xác nhận mật khẩu.");
      return;
    }
    setBusy(true);
    try {
      if (mode)
        await register({
          email: email.trim(),
          password,
          confirmPassword: confirm,
          fullName: name.trim(),
          phoneNumber: phone,
        });
      else await login(email, password);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Screen>
      <View
        style={{
          backgroundColor: palette.navy,
          padding: 24,
          borderRadius: 24,
          gap: 12,
          marginTop: 12,
        }}
      >
        <Text style={{ fontSize: 13, letterSpacing: 3, color: "#F4B48A" }}>
          RELIEFCONNECT
        </Text>
        <Text
          style={{
            fontSize: 32,
            lineHeight: 39,
            fontWeight: "800",
            color: "white",
          }}
        >
          Kết nối hỗ trợ.{"\n"}Cùng nhau sẻ chia.
        </Text>
        <Text style={{ color: "#C9DAD9", lineHeight: 22 }}>
          Theo dõi cứu trợ, quản lý vật tư và kết nối tình nguyện viên.
        </Text>
      </View>
      <Heading
        title={mode ? "Tạo tài khoản" : "Chào bạn trở lại"}
        subtitle={
          mode
            ? "Tài khoản mới có vai trò người yêu cầu hỗ trợ."
            : "Đăng nhập để tiếp tục công việc."
        }
      />
      <Card>
        {mode && (
          <>
            <Field
              label="Họ và tên"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
            <Field
              label="Số điện thoại"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
          </>
        )}
        <Field
          label="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoComplete="email"
        />
        <Field
          label="Mật khẩu"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete={mode ? "new-password" : "current-password"}
        />
        {mode && (
          <Field
            label="Xác nhận mật khẩu"
            value={confirm}
            onChangeText={setConfirm}
            secureTextEntry
          />
        )}
        <Notice text={error} error />
        <Button
          title={mode ? "Đăng ký" : "Đăng nhập"}
          loading={busy}
          onPress={submit}
        />
        <Button
          title={
            mode ? "Đã có tài khoản? Đăng nhập" : "Chưa có tài khoản? Đăng ký"
          }
          variant="secondary"
          onPress={() => {
            setMode(!mode);
            setError("");
          }}
        />
      </Card>
      <Button
        title="Quên mật khẩu?"
        variant="secondary"
        onPress={() => navigation.navigate("Recovery")}
      />
      <Text style={[styles.muted, { textAlign: "center" }]}>{serverUrl}</Text>
      <Button
        title="Đổi địa chỉ server"
        variant="secondary"
        onPress={() => navigation.navigate("Connection")}
      />
    </Screen>
  );
}
