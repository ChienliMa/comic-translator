import React, { Component } from 'react';
import './App.css';
import './fonts.css';
import {Project} from './utils'
import GalleryComponent from './components/Gallery';
import InteractiveCanvasComponent from './components/InteractiveCanvas';

class App extends Component {

    constructor (props) {
        super(props);
        this.state = new Project();
    }

  render() {
    return (
      <div className="App">
          <div className="container">
              <GalleryComponent project={this.state}/>
              <div id="EditorContainer" className="editor-container">
                  <InteractiveCanvasComponent project={this.state}/>
              </div>
          </div>
      </div>
    );
  }
}

export default App;
