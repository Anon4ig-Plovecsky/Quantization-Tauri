use strum::IntoEnumIterator;

#[derive(strum_macros::EnumIter, std::fmt::Debug)]
pub enum FormulaType {
    SinKXAndB,
    CosKXAndB,
    SinKXPlusB,
    CosKXPlusB
}

struct FormulaTypeVisitor;
impl<'de> serde::de::Visitor<'de> for FormulaTypeVisitor {
    type Value = FormulaType;

    fn expecting(&self, formatter: &mut std::fmt::Formatter) -> std::fmt::Result {
        write!(formatter, "Visitor expects a string version of an integer equal to the enum value in FormulaType")
    }

    fn visit_i64<E>(self, v: i64) -> Result<Self::Value, E>
    where
        E: serde::de::Error
    {
        let mut iter_number = 0_i64;
        let mut res_value: Option<FormulaType> = None;
        for enum_variable in FormulaType::iter() {
            if v == iter_number {
                res_value = Some(enum_variable);
                break;
            }
            iter_number += 1;
        }

        return match res_value {
            Some(res) => {
                Ok(res)
            }
            None => {
                Err(serde::de::Error::invalid_value(serde::de::Unexpected::Signed(v), &Self))
            }
        }
    }

    fn visit_u64<E>(self, v: u64) -> Result<Self::Value, E>
    where
        E: serde::de::Error
    {
        self.visit_i64(v as i64)
    }

    fn visit_str<E>(self, v: &str) -> Result<Self::Value, E>
    where
        E: serde::de::Error
    {
        let res_parsed_value = v.parse::<i64>();
        return match res_parsed_value {
            Ok(enum_value) => {
                self.visit_i64(enum_value)
            }
            Err(_err) => {
                Err(serde::de::Error::invalid_value(serde::de::Unexpected::Str(v), &self))
            }
        }
    }
}
impl<'de> serde::Deserialize<'de> for FormulaType {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>
    {
        let formula_type_visitor = FormulaTypeVisitor;
        return deserializer.deserialize_any(formula_type_visitor);
    }

    fn deserialize_in_place<D>(_deserializer: D, _place: &mut Self) -> Result<(), D::Error>
    where
        D: serde::Deserializer<'de>
    {
        unimplemented!()
    }
}

#[derive(serde::Deserialize, std::fmt::Debug)]
pub enum QuantizationType {
    Upper,
    Lower,
    Closer
}