import './App.css';
import React from "react";
import { ReactComponent as Pause } from './pause.svg';
import { ReactComponent as Play } from './play.svg';
import { ReactComponent as Gear } from './gear.svg';


const debug = true;

const saveKey = "heartosisOneGameSave";

const resources = {
  health: {
    color: '#cf1b1b',
  },
  energy: {
    color: '#1144bd',
  },
  food: {
    color: '#119915',
  },
  wood: {
    color: '#644325',
  },
  threat: {
    color: '#ff0000',
  },
}

const skills = {
  fighter: {
    color: '#000000',
  },
  explorer: {
    color: '#123456',
  },
}

function Resource(props) {
  let r = resources;
  if (props.skill) {
    r = skills;
  }
  return Math.round(props.percent);
  return <div className={'resource ' + (props.shiny ? 'shiny' : '')}>
    <div
      style={{
        height: props.percent + "%",
        postition: "absolute",
        top: 0,
        left: 0,
        width: '100%',
        backgroundColor: r[props.name].color,
      }}
    ></div></div>
}

class App extends React.Component {
  constructor(props) {
    super(props);
    this.lastFrame = window.performance.now();
    this.updateFrame = window.performance.now();
    this.lastSave = window.performance.now();
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
      window.game = this;
    }
  }

  reset = () => {
    this.confirmingReset = false;
    let state = this.getInitState();
    this.setState(state);
  }

  resetLocalVars = () => {
  };

  getInitState = () => {
    let state = {
      modal: false,
      paused: false,
      gameDone: false,
      showSettings: false,
      showTips: false,
      doneNotified: false,
      doneConfirmed: false,
      modalConfirm: null,
      showSelector: false,
      sharedResources: {
        food: 0,
        wood: 0,
        threat: 0,
      },
      population: [
        this.createPerson(),
        this.createPerson(),
        this.createPerson(),
        this.createPerson(),
      ],
      curCommand: {
        active: false,
        name: 'eat',
        secsLeft: 0,
      },
      stepLengthSecs: 1,
    };
    return state;
  };

  createPerson = () => {
    return {
      resources: {
        health: 50,
        energy: 50,
        food: 50,
        wood: 50,
        threat: 50,
      },
      skills: {
        explorer: 0,
        fighter: 0,
      },
    }
  }

  eat = (state, deltaSec) => {
    state.population.forEach((pop) => {
      let foodConsumedPerAction = 10;
      let energyGainedPerAction = 20;
      let amtConsumed = foodConsumedPerAction * deltaSec / state.stepLengthSecs;
      if (pop.resources.food >= amtConsumed) {
        pop.resources.energy += energyGainedPerAction * deltaSec / state.stepLengthSecs;
        pop.resources.food -= amtConsumed;
      }
    });
  }
  
  gather = (state, deltaSec) => {
    state.population.forEach((pop) => {
      let energyConsumedPerAction = 10;
      let foodGainedPerAction = 20;
      let amtConsumed = energyConsumedPerAction * deltaSec / state.stepLengthSecs;
      if (pop.resources.energy >= amtConsumed) {
        pop.resources.food += foodGainedPerAction * deltaSec / state.stepLengthSecs;
        pop.resources.energy -= amtConsumed;
      }
    });
  }
    
  explore = (state, deltaSec) => {
    state.population.forEach((pop) => {
      let energyConsumedPerAction = 30;
      let threatGainedPerAction = 0;
      let amtConsumed = energyConsumedPerAction * deltaSec / state.stepLengthSecs;
      if (pop.resources.energy >= amtConsumed) {
        pop.resources.threat += threatGainedPerAction * deltaSec / state.stepLengthSecs;
        pop.resources.energy -= amtConsumed;
      }
    });
  }

  startCommand = (command, state) => {
    if (state.curCommand.active) {
      if (debug) {
        console.log('trying to start command with command already active');
      }
      return;
    }
    state.curCommand.name = command;
    state.curCommand.secsLeft = state.stepLengthSecs;
    state.curCommand.active = true;
  }

  update = (deltaSec, debugFrame) => {
    let s = this.state;
    let updates = {
      gameDone: s.gameDone,
    };

    if (s.curCommand.active) {
      this[s.curCommand.name](s, deltaSec);
      s.curCommand.secsLeft -= deltaSec;
      if (s.curCommand.secsLeft <= 0) {
        s.curCommand.secsLeft = 0;
        s.curCommand.active = false;
      }
    }

    this.setState(updates);
  };

  render() {
    let s = this.state;
    return (
      <div id="verticalFlex">
        <div id="flex">
          {(s.modal || s.confirmReset || s.showSettings || s.showTips) && <div id="modal-bg">
            <div id="modal">
              {s.showTips && <>
                Tips
                <button onClick={() => { this.setState({ showTips: false }) }}>OK</button>
              </>}
              {s.showSettings && !s.confirmReset && !s.showTips && <>
                <p className="thin">Settings</p>
                <p><button onClick={() => { this.setState({ confirmReset: true }) }}>Reset</button></p>

                <button onClick={() => { this.setState({ showSettings: false }) }}>Back</button>
              </>}
              {s.confirmReset && <p>Completely reset the game and start over?</p>}
              {s.gameDone && !s.doneConfirmed && <div>
                <p>Winner!</p>
                <p className="thin">Game made for <a style={{ color: '#87bbe6' }} href="https://itch.io/jam/new-years-incremental-game-jam-2023">New Years Incremental Game Jam 2023</a> by heartosis & dHo</p>
                <p>Thank you for playing!</p>
              </div>}
              {s.modal && <p>{s.modalMessage}</p>}
              {s.confirmReset &&
                <button onClick={() => { this.reset() }}>Confirm Reset</button>}
              {(s.confirmReset) &&
                <button onClick={() => this.setState({ confirmReset: false })}>Cancel</button>}
              {s.modal && <button onClick={() => { this.setState({ doneConfirmed: s.gameDone, modal: false, paused: false, modalMessage: null }) }}>{s.modalConfirm || 'OK'}</button>}
            </div>
          </div>}
          <div className="panel leftPanel" id="commandPanel">

            {s.gameDone && <div style={{ display: "flex" }}>
              <div style={{ flexGrow: 1, textAlign: 'right' }}>
                <span>You won!</span>
              </div>
            </div>}

            <div>
              <button onClick={() => { this.setState((state) => {this.startCommand('eat', state)})}} disabled = {s.curCommand.active}>Eat</button>
              <button onClick={() => { this.setState((state) => {this.startCommand('gather', state)})}}  disabled = {s.curCommand.active}>Gather</button>
              <button onClick={() => { this.setState((state) => {this.startCommand('explore', state)})}}  disabled = {s.curCommand.active}>Explore</button>
            </div>

            <div id="controls">
              <span style={{ 'cursor': 'pointer', fontSize: '1em', marginRight: '5px' }}
                onClick={() => { this.setState({ paused: !s.paused }) }}>
                {s.paused ? <Play></Play> : <Pause></Pause>}</span>
              <span style={{ 'cursor': 'pointer', fontSize: '1.5em' }}
                onClick={() => { this.setState({ showSettings: true }) }}>
                <Gear></Gear></span>
            </div>
          </div>
          <div className="panel" id="mainPanel">
            <table className="popGrid">
              <thead>
                <tr>
                  <td></td>
                  {s.population.map((pop, popIndex) => {
                    return (<td key={popIndex}>{popIndex+1}</td>);
                  })}
                </tr>
              </thead>
              <tbody>
                <>
                  {Object.keys(resources).map((resource, resIndex) => {
                    return (<tr key={resIndex}>
                      <td className="resName">{title(resource.toString())}</td>
                      <>
                        {s.population.map((pop, popIndex) => {
                          return (<td key={popIndex} className="realResource">
                            <Resource name={resource} percent={pop.resources[resource]}></Resource>
                          </td>);
                        })}
                      </>
                    </tr>
                    );
                  })}
                </><>
                  {Object.keys(skills).map((skill, skillIndex) => {
                    return (<tr key={skillIndex}>
                      <td className="resName">{title(skill.toString())}</td>
                      <>
                        {s.population.map((pop, popIndex) => {
                          return (<td key={popIndex} className="realResource">
                            <Resource name={skill} percent={pop.skills[skill]} skill={true}></Resource>
                          </td>);
                        })}
                      </>
                    </tr>);
                  })}
                </>
              </tbody>
            </table>
          </div>
        </div>
      </div >
    );
  }




  save = () => {
    localStorage.setItem(saveKey, JSON.stringify(this.state));
  };

  componentDidMount() {
    window.addEventListener("beforeunload", this.save);
    this.renderID = window.requestAnimationFrame(this.gameLoop);
  }

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
      this.update(minDelta / 1000, debugFrame);
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

function title(name) {
  return name.charAt(0).toUpperCase() + name.slice(1)
}

export default App;
