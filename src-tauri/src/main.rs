// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod deserialization;
use deserialization::{ FormulaType, QuantizationType };

#[tauri::command]
fn start_quantization(formula_type: FormulaType,
                      variable_k: f64,
                      variable_b: f64,
                      quantization_type: QuantizationType,
                      quantization_step: f64) {
    // TODO:
    println!("formula_type: {:}\nvariable_x: {}\nvariable_b: {}\nquantization_type: {:}\nquantization_step: {}",
             format!("{:?}", formula_type), variable_k, variable_b, format!("{:?}", quantization_type), quantization_step);
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![start_quantization])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}