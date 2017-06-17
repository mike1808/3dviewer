import React, {Component} from 'react';
import './App.css';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';

import Viewer from '../Viewer/Viewer';

class App extends Component {
  render() {
    return (
      <MuiThemeProvider>
        <div className="App">
          <Viewer />
        </div>
      </MuiThemeProvider>
    );
  }
}

export default App;
