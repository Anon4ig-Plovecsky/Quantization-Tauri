// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod deserialization;
mod quantization_controller;
use deserialization::{FormulaType, QuantizationType };

#[tauri::command]
fn start_quantization(formula_type: FormulaType,
                      variable_k: f64,
                      variable_b: f64,
                      quantization_type: QuantizationType,
                      quantization_step: f64,
                      max_value_t: f64) -> Option<quantization_controller::QuantizationController> {
    println!("formula_type: {:}\nvariable_x: {}\nvariable_b: {}\nquantization_type: {:}\nquantization_step: {}\nmax_value_t: {}",
             format!("{:?}", formula_type), variable_k, variable_b, format!("{:?}", quantization_type), quantization_step, max_value_t);

    let mut quantization_controller = quantization_controller::QuantizationController::new(formula_type,
        variable_k, variable_b, quantization_type, quantization_step, max_value_t);
    quantization_controller.calc_function();
    let res_quantization_signal = quantization_controller.calc_quantized_signal();
    return match res_quantization_signal {
        Ok(_) => {
            Some(quantization_controller)
        }
        Err(_) => {
            None
        }
    }
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![start_quantization])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}