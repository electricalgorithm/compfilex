_prefixScalerMotor = "S";
_prefixMixerMotor = "M";
_prefixExtruderMotor = "E";
_prefixPullerMotor = "P"
_prefixActiveRadius = "AR"

bothCaseArray = (prefix, number) => {
    return [prefix + number.toString(), prefix.toLowerCase() + number.toString()];
}

module.exports = bothCaseArray, _prefixPullerMotor, _prefixExtruderMotor, _prefixMixerMotor, _prefixScalerMotor
