use serde::ser::{SerializeSeq, SerializeStruct};
use crate::deserialization::{FormulaType, QuantizationType};
type Point = (f64, f64);
static STRUCT_NAME: &str = "quantizedFunction";
static FUNCTION_POINTS_NAME: &str = "functionPoints";
static QUANTIZED_SIGNAL_NAME: &str = "quantizedSignal";
static MIN_N_VALUE_NAME: &str = "minValueN";
static MAX_N_VALUE_NAME: &str = "maxValueN";
const TOLERANCE: f64 = 1e-3_f64;

pub enum ErrorType {
    Fail,
    _NotImplemented,
    Unexpected
}

// A structure that defines a function by a given formula, and also calculates a quantized function by a given type
pub struct QuantizationController {
    formula_type: FormulaType,
    variable_k: f64,
    variable_b: f64,
    quantization_type: QuantizationType,
    quantization_step: f64,
    max_value_time: f64,

    // Non-initialize members; Serializing members
    vec_function_points: Vec<Point>,
    vec_quantized_signal: Vec<Point>,
    min_n_value: f64,
    max_n_value: f64
}
impl QuantizationController {
    // Constructor
    pub fn new(formula_type: FormulaType, variable_k: f64, variable_b: f64, quantization_type: QuantizationType,
               quantization_step: f64, max_value_t: f64) -> Self {
        QuantizationController {
            formula_type,
            variable_k,
            variable_b,
            quantization_type,
            quantization_step,
            max_value_time: max_value_t,
            vec_function_points: Vec::new(),
            vec_quantized_signal: Vec::new(),
            min_n_value: f64::MAX,
            max_n_value: f64::MIN
        }
    }

    // Calculates a function using a given formula
    pub fn calc_function(&mut self) {
        // Find the number of steps to obtain points for t from 0 to max_value_time
        let step_number: i32 = f64::floor(self.max_value_time / TOLERANCE) as i32;
        for step_index in 0_i32..step_number {
            let t_value = f64::from(step_index) * TOLERANCE;
            let n_value = self.calc_function_value(t_value);
            let point: Point = (t_value, n_value);

            self.vec_function_points.push(point);
        }
    }

    // Calculates the value of N from the argument t of the selected function
    fn calc_function_value(&self, t_value: f64) -> f64 {
        return match self.formula_type {
            FormulaType::SinKXAndB => {
                f64::sin(self.variable_k * t_value + self.variable_b)
            }
            FormulaType::CosKXAndB => {
                f64::cos(self.variable_k * t_value + self.variable_b)
            }
            FormulaType::SinKXPlusB => {
                f64::sin(self.variable_k * t_value) + self.variable_b
            }
            FormulaType::CosKXPlusB => {
                f64::cos(self.variable_k * t_value) + self.variable_b
            }
        }
    }

    // Performs quantization of a signal and returns the result of the quantization
    pub fn calc_quantized_signal(&mut self) -> Result<bool, ErrorType> {
        if self.vec_function_points.is_empty() {
            return Err(ErrorType::Fail);
        }

        // Runs each point of the function and relate it to the corresponding type of quantization level
        let mut last_quantized_level: i32 = i32::MIN;
        for pt_function in &self.vec_function_points {
            let mut current_quantized_level = 0_i32;
            let pt_quantized = self.calc_quantized_point(*pt_function, &mut current_quantized_level);

            // If the current quantization level has changed compared to the last level, then saves the quantized signal points
            if current_quantized_level != last_quantized_level {
                // if t != start_point
                if last_quantized_level != i32::MIN {
                    let pt_start = (pt_quantized.0, f64::from(last_quantized_level) * self.quantization_step);
                    self.vec_quantized_signal.push(pt_start);
                }
                // If the value of n is greater or less than the maximum or minimum value, respectively, then overwrite it
                if pt_quantized.1 < self.min_n_value {
                    self.min_n_value = pt_quantized.1;
                }
                if pt_quantized.1 > self.max_n_value {
                    self.max_n_value = pt_quantized.1;
                }

                let pt_end = (pt_quantized.0, pt_quantized.1);
                self.vec_quantized_signal.push(pt_end);

                // Save the current quantization level
                last_quantized_level = current_quantized_level;
            }
        }

        return if self.vec_quantized_signal.is_empty() {
            Err(ErrorType::Unexpected)
        } else {
            Ok(true)
        }
    }

    /// Determines the current quantization level and returns a point
    /// # Params
    /// __`[in]`__ _pt_function_ - function point for quantization <br/>
    /// __`[out]`__ _quantized_level_ - Quantization level (counted from zero)
    /// # Return
    /// Returns the point of the quantized function
    fn calc_quantized_point(&self, pt_function: Point, quantized_level: &mut i32) -> Point {
        let n_value_function = f64::round(pt_function.1 / TOLERANCE) * TOLERANCE;

        match self.quantization_type {
            QuantizationType::Upper => {
                *quantized_level = f64::ceil(n_value_function / self.quantization_step) as i32;
            }
            QuantizationType::Lower => {
                *quantized_level = f64::floor(n_value_function / self.quantization_step) as i32;
            }
            QuantizationType::Closer => {
                *quantized_level = f64::round(n_value_function / self.quantization_step) as i32;
            }
        }

        let n_value_quantized = f64::from(*quantized_level) * self.quantization_step;
        return (pt_function.0, n_value_quantized);
    }
}

// Serializing the QuantizationController structure with members vec_function_points and vec_quantized_signal
impl serde::Serialize for QuantizationController {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer
    {
        let mut serialize_struct = serializer.serialize_struct(STRUCT_NAME, 4)?;

        let serialized_function_points = SerializedPointsVec { vec: &self.vec_function_points };
        serialize_struct.serialize_field(FUNCTION_POINTS_NAME, &serialized_function_points)?;
        let serialized_quantized_signal = SerializedPointsVec { vec: &self.vec_quantized_signal };
        serialize_struct.serialize_field(QUANTIZED_SIGNAL_NAME, &serialized_quantized_signal)?;

        serialize_struct.serialize_field(MIN_N_VALUE_NAME, &self.min_n_value)?;
        serialize_struct.serialize_field(MAX_N_VALUE_NAME, &self.max_n_value)?;

        serialize_struct.end()
    }
}
struct SerializedPointsVec<'vec> {
    vec: &'vec Vec<Point>
}
impl serde::Serialize for SerializedPointsVec<'_> {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer
    {
        let mut serialized_vec = serializer.serialize_seq(Some(self.vec.len()))?;
        for i in 0..self.vec.len() {
            serialized_vec.serialize_element(&self.vec[i])?;
        }
        serialized_vec.end()
    }
}