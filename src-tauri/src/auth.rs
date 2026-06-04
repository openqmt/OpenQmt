use argon2::{
    password_hash::{rand_core::OsRng, PasswordHash, PasswordHasher, PasswordVerifier, SaltString},
    Argon2,
};
use chrono::Utc;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;
use std::sync::Mutex;
use uuid::Uuid;

// ── Data Models ──

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct User {
    pub id: String,
    pub email: String,
    pub password_hash: String,
    pub github_id: Option<String>,
    pub nickname: String,
    pub avatar_url: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct Session {
    user_id: String,
    token: String,
    created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct UserDatabase {
    users: HashMap<String, User>, // email -> User
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct SessionDatabase {
    sessions: HashMap<String, Session>, // token -> Session
}

// ── GitHub Device Flow ──

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GithubDeviceCode {
    pub device_code: String,
    pub user_code: String,
    pub verification_uri: String,
    pub expires_in: u64,
    pub interval: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GithubTokenResult {
    pub success: bool,
    pub access_token: Option<String>,
    pub error: Option<String>,
}

// ── Tauri Command Results ──

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuthResult {
    pub success: bool,
    pub message: String,
    pub user: Option<UserInfo>,
    pub token: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserInfo {
    pub id: String,
    pub email: String,
    pub nickname: String,
    pub avatar_url: Option<String>,
    pub github_id: Option<String>,
}

// ── State ──

pub struct AuthState {
    current_token: Mutex<Option<String>>,
    github_client_id: String,
}

impl AuthState {
    pub fn new() -> Self {
        Self {
            current_token: Mutex::new(None),
            github_client_id: "Ov23li3tJb1shqzEFjMm".to_string(), // 用户可替换为自己的 GitHub OAuth App Client ID
        }
    }
}

// ── Helpers ──

fn data_dir() -> PathBuf {
    let base = dirs::data_dir().unwrap_or_else(|| PathBuf::from("."));
    let dir = base.join("OpenQmt");
    fs::create_dir_all(&dir).ok();
    dir
}

fn users_db_path() -> PathBuf {
    data_dir().join("users.json")
}

fn sessions_db_path() -> PathBuf {
    data_dir().join("sessions.json")
}

fn load_users() -> UserDatabase {
    let path = users_db_path();
    if path.exists() {
        let data = fs::read_to_string(&path).unwrap_or_default();
        serde_json::from_str(&data).unwrap_or(UserDatabase {
            users: HashMap::new(),
        })
    } else {
        UserDatabase {
            users: HashMap::new(),
        }
    }
}

fn save_users(db: &UserDatabase) -> Result<(), String> {
    let data = serde_json::to_string_pretty(db).map_err(|e| e.to_string())?;
    fs::write(users_db_path(), data).map_err(|e| e.to_string())
}

fn load_sessions() -> SessionDatabase {
    let path = sessions_db_path();
    if path.exists() {
        let data = fs::read_to_string(&path).unwrap_or_default();
        serde_json::from_str(&data).unwrap_or(SessionDatabase {
            sessions: HashMap::new(),
        })
    } else {
        SessionDatabase {
            sessions: HashMap::new(),
        }
    }
}

fn save_sessions(db: &SessionDatabase) -> Result<(), String> {
    let data = serde_json::to_string_pretty(db).map_err(|e| e.to_string())?;
    fs::write(sessions_db_path(), data).map_err(|e| e.to_string())
}

fn hash_password(password: &str) -> Result<String, String> {
    let salt = SaltString::generate(&mut OsRng);
    let argon2 = Argon2::default();
    let hash = argon2
        .hash_password(password.as_bytes(), &salt)
        .map_err(|e| e.to_string())?;
    Ok(hash.to_string())
}

fn verify_password(password: &str, hash: &str) -> Result<bool, String> {
    let parsed = PasswordHash::new(hash).map_err(|e| e.to_string())?;
    Ok(Argon2::default()
        .verify_password(password.as_bytes(), &parsed)
        .is_ok())
}

fn user_to_info(user: &User) -> UserInfo {
    UserInfo {
        id: user.id.clone(),
        email: user.email.clone(),
        nickname: user.nickname.clone(),
        avatar_url: user.avatar_url.clone(),
        github_id: user.github_id.clone(),
    }
}

// ── Tauri Commands ──

#[tauri::command]
pub fn auth_register(email: String, password: String, state: tauri::State<AuthState>) -> AuthResult {
    // validate email
    if !email.contains('@') || !email.contains('.') {
        return AuthResult {
            success: false,
            message: "邮箱格式不正确".to_string(),
            user: None,
            token: None,
        };
    }
    if password.len() < 6 {
        return AuthResult {
            success: false,
            message: "密码至少6位".to_string(),
            user: None,
            token: None,
        };
    }

    let mut db = load_users();
    if db.users.contains_key(&email) {
        return AuthResult {
            success: false,
            message: "该邮箱已注册".to_string(),
            user: None,
            token: None,
        };
    }

    let hash = match hash_password(&password) {
        Ok(h) => h,
        Err(e) => {
            return AuthResult {
                success: false,
                message: format!("密码加密失败: {}", e),
                user: None,
                token: None,
            }
        }
    };

    let user_id = Uuid::new_v4().to_string();
    let nickname = email.split('@').next().unwrap_or("用户").to_string();

    let user = User {
        id: user_id.clone(),
        email: email.clone(),
        password_hash: hash,
        github_id: None,
        nickname,
        avatar_url: None,
        created_at: Utc::now().to_rfc3339(),
    };

    let info = user_to_info(&user);
    db.users.insert(email, user);

    if let Err(e) = save_users(&db) {
        return AuthResult {
            success: false,
            message: format!("保存用户数据失败: {}", e),
            user: None,
            token: None,
        };
    }

    // auto-login after register
    let token = Uuid::new_v4().to_string();
    let session = Session {
        user_id: user_id,
        token: token.clone(),
        created_at: Utc::now().to_rfc3339(),
    };
    let mut sdb = load_sessions();
    sdb.sessions.insert(token.clone(), session);
    let _ = save_sessions(&sdb);

    *state.current_token.lock().unwrap() = Some(token.clone());

    AuthResult {
        success: true,
        message: "注册成功".to_string(),
        user: Some(info),
        token: Some(token),
    }
}

#[tauri::command]
pub fn auth_login(email: String, password: String, state: tauri::State<AuthState>) -> AuthResult {
    let db = load_users();
    let user = match db.users.get(&email) {
        Some(u) => u,
        None => {
            return AuthResult {
                success: false,
                message: "邮箱或密码错误".to_string(),
                user: None,
                token: None,
            }
        }
    };

    match verify_password(&password, &user.password_hash) {
        Ok(true) => {}
        _ => {
            return AuthResult {
                success: false,
                message: "邮箱或密码错误".to_string(),
                user: None,
                token: None,
            }
        }
    }

    let info = user_to_info(user);
    let token = Uuid::new_v4().to_string();
    let session = Session {
        user_id: user.id.clone(),
        token: token.clone(),
        created_at: Utc::now().to_rfc3339(),
    };
    let mut sdb = load_sessions();
    sdb.sessions.insert(token.clone(), session);
    let _ = save_sessions(&sdb);

    *state.current_token.lock().unwrap() = Some(token.clone());

    AuthResult {
        success: true,
        message: "登录成功".to_string(),
        user: Some(info),
        token: Some(token),
    }
}

#[tauri::command]
pub fn auth_logout(state: tauri::State<AuthState>) -> AuthResult {
    let token_opt = state.current_token.lock().unwrap().take();
    if let Some(token) = token_opt {
        let mut sdb = load_sessions();
        sdb.sessions.remove(&token);
        let _ = save_sessions(&sdb);
    }
    AuthResult {
        success: true,
        message: "已退出登录".to_string(),
        user: None,
        token: None,
    }
}

#[tauri::command]
pub fn auth_get_current_user(state: tauri::State<AuthState>) -> AuthResult {
    let token_opt = state.current_token.lock().unwrap().clone();
    match token_opt {
        Some(token) => {
            let sdb = load_sessions();
            match sdb.sessions.get(&token) {
                Some(session) => {
                    let db = load_users();
                    let user = db.users.values().find(|u| u.id == session.user_id);
                    match user {
                        Some(u) => AuthResult {
                            success: true,
                            message: String::new(),
                            user: Some(user_to_info(u)),
                            token: Some(token),
                        },
                        None => AuthResult {
                            success: false,
                            message: "用户不存在".to_string(),
                            user: None,
                            token: None,
                        },
                    }
                }
                None => AuthResult {
                    success: false,
                    message: "会话已过期".to_string(),
                    user: None,
                    token: None,
                },
            }
        }
        None => AuthResult {
            success: false,
            message: "未登录".to_string(),
            user: None,
            token: None,
        },
    }
}

#[tauri::command]
pub fn auth_restore_session(token: String, state: tauri::State<AuthState>) -> AuthResult {
    let sdb = load_sessions();
    match sdb.sessions.get(&token) {
        Some(session) => {
            let db = load_users();
            let user = db.users.values().find(|u| u.id == session.user_id);
            match user {
                Some(u) => {
                    *state.current_token.lock().unwrap() = Some(token.clone());
                    AuthResult {
                        success: true,
                        message: String::new(),
                        user: Some(user_to_info(u)),
                        token: Some(token),
                    }
                }
                None => AuthResult {
                    success: false,
                    message: "用户不存在".to_string(),
                    user: None,
                    token: None,
                },
            }
        }
        None => AuthResult {
            success: false,
            message: "会话已过期".to_string(),
            user: None,
            token: None,
        },
    }
}

// ── GitHub Device Flow ──

#[tauri::command]
pub async fn github_start_device_flow(state: tauri::State<'_, AuthState>) -> Result<GithubDeviceCode, String> {
    let client_id = state.github_client_id.clone();
    let client = reqwest::Client::new();
    let resp = client
        .post("https://github.com/login/device/code")
        .header("Accept", "application/json")
        .form(&[("client_id", client_id.as_str()), ("scope", "read:user:user:email")])
        .send()
        .await
        .map_err(|e| format!("请求失败: {}", e))?;

    let data: serde_json::Value = resp.json().await.map_err(|e| format!("解析失败: {}", e))?;

    Ok(GithubDeviceCode {
        device_code: data["device_code"].as_str().unwrap_or("").to_string(),
        user_code: data["user_code"].as_str().unwrap_or("").to_string(),
        verification_uri: data["verification_uri"]
            .as_str()
            .unwrap_or("https://github.com/login/device")
            .to_string(),
        expires_in: data["expires_in"].as_u64().unwrap_or(900),
        interval: data["interval"].as_u64().unwrap_or(5),
    })
}

#[tauri::command]
pub async fn github_poll_token(
    device_code: String,
    state: tauri::State<'_, AuthState>,
) -> Result<GithubTokenResult, String> {
    let client_id = state.github_client_id.clone();
    let client = reqwest::Client::new();
    let resp = client
        .post("https://github.com/login/oauth/access_token")
        .header("Accept", "application/json")
        .form(&[
            ("client_id", client_id.as_str()),
            ("device_code", device_code.as_str()),
            ("grant_type", "urn:ietf:params:oauth:grant-type:device_code"),
        ])
        .send()
        .await
        .map_err(|e| format!("请求失败: {}", e))?;

    let data: serde_json::Value = resp.json().await.map_err(|e| format!("解析失败: {}", e))?;

    if let Some(error) = data["error"].as_str() {
        return Ok(GithubTokenResult {
            success: false,
            access_token: None,
            error: Some(error.to_string()),
        });
    }

    let access_token = data["access_token"].as_str().unwrap_or("").to_string();

    // fetch GitHub user info
    let user_resp = client
        .get("https://api.github.com/user")
        .header("Authorization", format!("token {}", access_token))
        .header("User-Agent", "OpenQmt")
        .send()
        .await
        .map_err(|e| format!("获取用户信息失败: {}", e))?;

    let gh_user: serde_json::Value = user_resp.json().await.map_err(|e| format!("解析失败: {}", e))?;

    let github_id = gh_user["id"].as_u64().map(|id| id.to_string()).unwrap_or_default();
    let nickname = gh_user["login"].as_str().unwrap_or("GitHub用户").to_string();
    let avatar_url = gh_user["avatar_url"].as_str().map(|s| s.to_string());

    // also try to fetch primary email
    let email_resp = client
        .get("https://api.github.com/user/emails")
        .header("Authorization", format!("token {}", access_token))
        .header("User-Agent", "OpenQmt")
        .send()
        .await;

    let email = if let Ok(resp) = email_resp {
        let emails: Vec<serde_json::Value> = resp.json().await.unwrap_or_default();
        emails
            .iter()
            .find(|e| e["primary"].as_bool().unwrap_or(false))
            .and_then(|e| e["email"].as_str().map(|s| s.to_string()))
            .unwrap_or_else(|| format!("github_{}@openqmt.local", github_id))
    } else {
        format!("github_{}@openqmt.local", github_id)
    };

    // create or update user in DB
    let mut db = load_users();
    let user = if let Some(existing) = db.users.get(&email) {
        // update github_id
        let mut updated = existing.clone();
        updated.github_id = Some(github_id.clone());
        if updated.avatar_url.is_none() {
            updated.avatar_url = avatar_url.clone();
        }
        updated
    } else {
        let user_id = Uuid::new_v4().to_string();
        User {
            id: user_id,
            email: email.clone(),
            password_hash: String::new(), // GitHub users don't need a password
            github_id: Some(github_id),
            nickname: nickname.clone(),
            avatar_url: avatar_url.clone(),
            created_at: Utc::now().to_rfc3339(),
        }
    };

    let info = user_to_info(&user);
    db.users.insert(email, user);
    let _ = save_users(&db);

    // create session
    let token = Uuid::new_v4().to_string();
    let user_id = info.id.clone();
    let session = Session {
        user_id,
        token: token.clone(),
        created_at: Utc::now().to_rfc3339(),
    };
    let mut sdb = load_sessions();
    sdb.sessions.insert(token.clone(), session);
    let _ = save_sessions(&sdb);

    *state.current_token.lock().unwrap() = Some(token.clone());

    Ok(GithubTokenResult {
        success: true,
        access_token: Some(token),
        error: None,
    })
}