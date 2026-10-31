import React, { useState } from "react";
import { Text } from "react-native";
import { useApp } from "../state/AppContext";
import {
  Button,
  Card,
  Field,
  Heading,
  Notice,
  Screen,
  styles,
} from "../components/ui";
export default function RecoveryScreen({ navigation }: any) {
  const { api } = useApp();
  const [step, setStep] = useState(0);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sessionId, setSession] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  async function submit() {
    setError("");
    setBusy(true);
    try {
      if (step === 0) {
        await api("/auth/forgot-password", {
          method: "POST",
          body: { email: email.trim() },
        });
        setStep(1);
      } else if (step === 1) {
        const result = await api("/auth/verify-reset-code", {
          method: "POST",
          body: { email: email.trim(), code: code.trim() },
        });
        setSession(result.resetSessionId);
        setStep(2);
      } else {
        if (password !== confirm)
          throw new Error("Mật khẩu xác nhận chưa khớp.");
        await api("/auth/reset-password", {
          method: "POST",
          body: {
            resetSessionId: sessionId,
            newPassword: password,
            confirmPassword: confirm,
          },
        });
        setDone(true);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Screen>
      <Heading
        title="Khôi phục mật khẩu"
        subtitle="Xác minh email trước khi đặt mật khẩu mới."
      />
      <Card>
        {done ? (
          <>
            <Notice text="Đã đặt lại mật khẩu. Đăng nhập bằng mật khẩu mới." />
            <Button title="Về đăng nhập" onPress={() => navigation.goBack()} />
          </>
        ) : (
          <>
            {step === 0 ? (
              <Field
                label="Email tài khoản"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
              />
            ) : step === 1 ? (
              <>
                <Text style={styles.muted}>
                  Nếu email tồn tại, mã xác minh đã được gửi theo cấu hình mail
                  của máy chủ. Nhập mã 6 số để tiếp tục.
                </Text>
                <Field
                  label="Mã xác minh"
                  value={code}
                  onChangeText={setCode}
                  keyboardType="number-pad"
                  maxLength={6}
                />
              </>
            ) : (
              <>
                <Field
                  label="Mật khẩu mới"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
                <Field
                  label="Xác nhận mật khẩu mới"
                  value={confirm}
                  onChangeText={setConfirm}
                  secureTextEntry
                />
              </>
            )}
            <Notice text={error} error />
            <Button
              title={
                step === 0
                  ? "Gửi mã xác minh"
                  : step === 1
                    ? "Xác minh mã"
                    : "Đặt lại mật khẩu"
              }
              onPress={submit}
              loading={busy}
            />
            {step === 1 && (
              <Button
                title="Nhập lại email / gửi lại mã"
                variant="secondary"
                onPress={() => {
                  setStep(0);
                  setError("");
                }}
              />
            )}
          </>
        )}
      </Card>
    </Screen>
  );
}
