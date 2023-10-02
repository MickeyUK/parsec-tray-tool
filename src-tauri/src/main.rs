// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
use tauri::{CustomMenuItem, SystemTray, SystemTrayMenu, SystemTrayMenuItem, SystemTrayEvent};
use tauri::Manager;
use std::sync::Mutex;
use std::fs::File;
use std::io::{Read, Write};
use std::thread;
use lazy_static::lazy_static;
use dirs;
use enigo::{Enigo, Key, KeyboardControllable};

#[derive(Clone, serde::Serialize)]
struct Tab {
  tab: i32,
}

#[derive(Clone, serde::Serialize)]
struct User {
    id: String,
    name: String,
}

#[derive(Clone, serde::Serialize)]
struct GuestStatus {
    user: User,
    status: String,
}

lazy_static! {
    static ref APP_HANDLE: Mutex<Option<tauri::AppHandle>> = Mutex::new(None);
    static ref AUTO_ACCEPT: Mutex<bool> = Mutex::new(false);
    static ref WATCH_HANDLE: Mutex<Option<thread::JoinHandle<()>>> = Mutex::new(None);
}

// Watches the parsec log file for updates
#[tauri::command]
fn start_watch() {
    
    // Get appdata directory
    let appdata = dirs::data_dir().unwrap();
    let appdata = appdata.join("Parsec");

    // Clear log file
    let file = File::create(appdata.join("log.txt"));
    if file.is_ok() {
        file.unwrap().write_all(b"").unwrap();
    }

    // Start watching log file
    let watch_handle = thread::spawn(move || {
        loop {
    
            let file = File::open(appdata.join("log.txt"));
            if file.is_ok() {

                // Get file contents
                let mut contents = String::new();
                file.unwrap().read_to_string(&mut contents).unwrap();

                // Split file contents into lines
                let lines = contents.split("\n");

                // Loop through lines
                for line in lines {

                    // Parse line
                    if line != "" {
                        parse_log_line(line);
                    }
                    
                }

                // Clear log file
                let file = File::create(appdata.join("log.txt"));
                file.unwrap().write_all(b"").unwrap();

            }

            // Sleep for 5 seconds
            thread::sleep(std::time::Duration::from_secs(3));

        }
    });

    // Store watch handle
    *WATCH_HANDLE.lock().unwrap() = Some(watch_handle);


}

// Stop watching the parsec log file
#[tauri::command]
fn stop_watch() {
    let handle = WATCH_HANDLE.lock().unwrap().take();
    if let Some(thread) = handle {
        thread.join().unwrap();
    }
}

// Parses a line from the parsec log file
fn parse_log_line(line: &str) {

    if line.contains("is trying to connect to your computer") {
        
        // Get guest name
        let (id, name) = extract_id_and_name(line);
        let user = User {
            id,
            name,
        };
        send_guest_status(GuestStatus {
            user,
            status: "connecting".to_string(),
        });

        // Auto accept
        if *AUTO_ACCEPT.lock().unwrap() {
            simulate_ctrl_f1_key_press();
        }

    } else

    if line.contains("connected.") {
        
        // Get guest name
        let (id, name) = extract_id_and_name(line);
        let user = User {
            id,
            name,
        };
        send_guest_status(GuestStatus {
            user,
            status: "connected".to_string(),
        });

    } else 

    if line.contains("disconnected.") {
        
        // Get guest name
        let (id, name) = extract_id_and_name(line);
        let user = User {
            id,
            name,
        };
        send_guest_status(GuestStatus {
            user,
            status: "disconnected".to_string(),
        });

    }

}

// Extracts the guest ID and name from a line in the parsec log file
fn extract_id_and_name(line: &str) -> (String, String) {
    let parts: Vec<&str> = line.split(' ').collect();
    let binding = parts[3..].join(" ");
    let name_with_id = binding.trim_matches(|c| c == '[' || c == ']' || c == '#');
    let mut name = String::new();
    let mut is_id = false;
    for c in name_with_id.chars() {
        if c == '#' {
            is_id = true;
        } else if is_id {

        } else {
            name.push(c);
        }
    }

    // Split line by hash
    let parts: Vec<&str> = line.split('#').collect();

    // Split first part by space
    let parts: Vec<&str> = parts[1].split(' ').collect();

    // ID is first word of the last part
    let id = parts[0].to_string();

    (id, name.trim().to_string())
}

// Sends guest status to TypeScript frontend
fn send_guest_status(guest_status: GuestStatus) {

    // Get app handle
    let app_handle = APP_HANDLE.lock().unwrap().clone().unwrap();

    // Send guest status to JS
    app_handle
    .emit_all("guest:status", guest_status)
    .expect("failed to emit guest status");

}

// Simulates a Ctrl+F1 key press
#[tauri::command]
fn simulate_ctrl_f1_key_press() {

    let mut enigo = Enigo::new();
    enigo.key_down(Key::Control);
    enigo.key_click(Key::F1);
    enigo.key_up(Key::Control);
    println!("Simulated Ctrl+F1 key press");

}

// Toggles auto accept for guests
#[tauri::command]
fn set_auto_accept(auto_accept: bool) {
    *AUTO_ACCEPT.lock().unwrap() = auto_accept;
}

// Main function
fn main() {

    let arcade = CustomMenuItem::new("arcade".to_string(), "Arcade");
    let host = CustomMenuItem::new("hosting".to_string(), "Hosting");
    let guests = CustomMenuItem::new("guests".to_string(), "Guests");
    let quit = CustomMenuItem::new("quit".to_string(), "Quit");
    let tray_menu = SystemTrayMenu::new()
    .add_item(arcade)
    .add_item(host)
    .add_item(guests)
    .add_native_item(SystemTrayMenuItem::Separator)
    .add_item(quit);

    let tray = SystemTray::new().with_menu(tray_menu);

    tauri::Builder::default()
    .plugin(tauri_plugin_store::Builder::default().build())
    .setup(|app| {
        let app_handle = app.handle();
        *APP_HANDLE.lock().unwrap() = Some(app_handle);
        Ok(())
    })

    // Invokable functions
    .invoke_handler(tauri::generate_handler![
        start_watch,
        stop_watch,
        simulate_ctrl_f1_key_press,
        set_auto_accept
    ])

    // System tray stuff
    .system_tray(tray)
    .on_window_event(|event| match event.event() {
        tauri::WindowEvent::CloseRequested { api, .. } => {
        event.window().hide().unwrap();
        api.prevent_close();
        }
        _ => {}
    })
    .on_system_tray_event(|app, event| match event {
        SystemTrayEvent::LeftClick { .. } => {
            let window = app.get_window("main").unwrap();
            window.show().unwrap();
            window.emit("tab", Tab { tab: 0 }).unwrap();
        }
        SystemTrayEvent::MenuItemClick { id, .. } => {
            let window = app.get_window("main").unwrap();

            match id.as_str() {
                "arcade" => {
                    window.show().unwrap();
                    window.emit("tab", Tab { tab: 0 }).unwrap();
                }
                "hosting" => {
                    window.show().unwrap();
                    window.emit("tab", Tab { tab: 1 }).unwrap();
                }
                "guests" => {
                    window.show().unwrap();
                    window.emit("tab", Tab { tab: 2 }).unwrap();
                }
                "quit" => {
                    window.emit("quit", {}).unwrap();
                }
                _ => {}
            }
        }
        _ => {}
    })

    // Build
    .build(tauri::generate_context!())
    .expect("error while building tauri application")
    .run(|_app_handle, event| match event {

        // This stops the app from terminating when the window is closed
        tauri::RunEvent::ExitRequested { api, .. } => {
            api.prevent_exit();
        }
        _ => {}
    });
}
