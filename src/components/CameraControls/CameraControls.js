import React, {Component} from 'react';
import PropTypes from 'prop-types';
import TextField from 'material-ui/TextField/TextField';

class CameraControls extends Component {
  state = {
    z: 0,
  };

  handleCameraZChange = (event) => {
    const z = event.target.value;
    this.setState({z});
    this.props.updateCameraPosition(0, 0, z);
  }

  render() {
    return (
      <div>
        <TextField
          floatingLabelText="Camera Z"
          label="Camera Z"
          value={this.state.z}
          onChange={this.handleCameraZChange}
        />
      </div>
    );
  }
}

CameraControls.propTypes = {
  updateCameraPosition: PropTypes.func.isRequried,
};

export default CameraControls;