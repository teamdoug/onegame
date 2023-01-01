import logo from './logo.svg';
import './App.css';
import React from "react";

const debug = false;
const maxWidth = 2000;
const maxHeight = 1500;

const saveKey = "heartosisOneGameSave";

class App extends React.Component {
  constructor(props) {
    super(props);
    this.lastFrame = window.performance.now();
    this.lastSave = window.performance.now();
    this.mainPanel = React.createRef();
    this.canvas = React.createRef();
    this.backgroundCanvas = React.createRef();
    this.offscreenCanvas = document.createElement("canvas");
    this.offscreenCanvas.width = maxWidth;
    this.offscreenCanvas.height = maxHeight;
    this.drewBackground = false;
    this.confirmingReset = false;
    this.width = 0;
    const storedState = localStorage.getItem(saveKey);
    if (false && storedState) {
      this.state = JSON.parse(storedState);
    } else {
      this.state = this.getInitState();
    }
    this.resetLocalVars();
    if (debug) {
      window.app = this;
    }
  }

  reset = () => {
    this.confirmingReset = false;
    let state = this.getInitState();
    this.setState(state, this.resizeCanvas);
  }

  resetLocalVars = () => {
  };

  getInitState = () => {
    let state = {
      paused: false,
      won: false,
    };
    return state;
  };

  update = (delta, debugFrame) => {
    let s = this.state;
    //let relDelta = delta / 1000;
    let updates = {
      won: s.won,
    };
  
    let forceResize = false;
   
    // do stuff

    let callback = forceResize ? this.resizeCanvas : () => {};
    this.setState(updates, callback);
  };

  render() {
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <p>
            Edit <code>src/App.js</code> and save to reload.
          </p>
          <a
            className="App-link"
            href="https://reactjs.org"
            target="_blank"
            rel="noopener noreferrer"
          >
            Learn React
          </a>
        </header>
      </div>
    );
  }



  save = () => {
    localStorage.setItem(saveKey, JSON.stringify(this.state));
  };

  componentDidMount() {
    window.addEventListener("beforeunload", this.save);
    window.addEventListener("resize", this.resizeCanvas);
    this.resizeCanvas();
    let canvas = this.offscreenCanvas;
    if (canvas) {
      let [w, h] = [canvas.width, canvas.height];
      const ctx = canvas.getContext("2d", { alpha: false });
      ctx.fillStyle = "#040612";
      ctx.fillRect(0, 0, w, h);
    }
    this.renderID = window.requestAnimationFrame(this.gameLoop);
  }

  resizeCanvas = () => {
    if (this.state.paused) {
      this.forceUpdate();
    }
  };


  componentWillUnmount() {
    window.removeEventListener("beforeunload", this.save);
    window.cancelAnimationFrame(this.renderID);
  }

  gameLoop = (tFrame) => {
    if (tFrame > this.lastSave + 10000) {
      this.save();
      this.lastSave = tFrame;
    }
    let delta = tFrame - this.lastFrame;
    if (delta > 1000) {
      if (debug) {
        console.log("delta too large: " + delta);
      }
      delta = 1000;
    }

    let minDelta = 1000 / 60;
    let debugFrame = false;
    if (tFrame % 1000 < minDelta) {
      debugFrame = true;
    }
    let loopCount = 0;
    while (delta > minDelta) {
      delta -= minDelta;
      if (this.state.paused) {
        continue;
      }
      loopCount += 1;
      this.update(minDelta, debugFrame);
      debugFrame = false;
    }
    if (debug && loopCount > 1) {
      console.log("loops", loopCount);
    }
    this.lastFrame = tFrame - delta;
    this.renderID = window.requestAnimationFrame(this.gameLoop);
  };

  togglePause = () => {
    this.setState({ paused: !this.state.paused });
  };


}

export default App;
