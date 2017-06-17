import React, {Component} from 'react';
import PropTypes from 'prop-types';
import CircularProgress from 'material-ui/CircularProgress';
import LinearProgress from 'material-ui/LinearProgress';
import {List, ListItem} from 'material-ui/List';

import styles from './FilesList.css';


class FileItem extends Component {
  render() {
    const {fileName, type, progressRef} = this.props;
    return (
      <ListItem
        primaryText={fileName}
        secondaryText={type}
        rightIcon={(
          <CircularProgress mode="determinate" value={0} ref={progressRef}/>
        )}
      />
    );
  }
}

FileItem.propTypes = {
  fileName: PropTypes.string.isRequired,
  type: PropTypes.string.isRequired,
  progressRef: PropTypes.func.isRequired,
};

class FilesList extends Component {
  render() {
    const {files, types, progressRef, totalProgressRef} = this.props;

    return (
      <div className="FilesList">
        <LinearProgress mode="determinate" value={0} style={{width: '50%'}} ref={totalProgressRef}/>
        <List style={{display: 'flex'}}>
          {files.map((file, i) => (
            <FileItem key={file} fileName={file} type={types[i]} progressRef={(progressEl) => {
              progressRef(progressEl, i);
            }}/>
          ))}
        </List>
      </div>
    );
  }
}

FilesList.propTypes = {
  files: PropTypes.arrayOf(PropTypes.string).isRequired,
  types: PropTypes.arrayOf(PropTypes.string).isRequired,
  progressRef: PropTypes.func.isRequired,
  totalProgressRef: PropTypes.func.isRequired,
};

export default FilesList;