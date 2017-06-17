import React, {Component} from 'react';
import PropTypes from 'prop-types';
import TextField from 'material-ui/TextField/TextField';
import Slider from 'material-ui/Slider';

class CameraControls extends Component {
  state = {
    z: 0,
  };

  handleCameraZChange = (event) => {
    const z = event.target.value;
    this.setState({z});
    this.props.updateCameraPosition(0, 0, z);
  };

  render() {
    const {zValue, minZ, maxZ, onCameraZChange} = this.props;

    return (
      <div>
        <p>Camera Z</p>
        <Slider
          name="cameraZ"
          value={zValue}
          min={minZ}
          max={maxZ}
          onChange={(event, value) => onCameraZChange(value)}
        />
      </div>
    );
  }
}

CameraControls.propTypes = {
  onCameraZChange: PropTypes.func.isRequired,
  zValue: PropTypes.number.isRequired,
  maxZ: PropTypes.number.isRequired,
  minZ: PropTypes.number.isRequired,
};

export default CameraControls;