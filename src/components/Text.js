import React, {Component} from 'react';
import CONST from '../constants';

class TextComponent extends Component {
    constructor (props) {
        super(props);
        this.state = props.text;
        this.keyPressed = props.keyPressed;
        this.proxy = props.proxy;
        this.dragState = CONST.NOT_DRAGGING;
        this.oriPos = [0,0];
        this.anchor = [0,0];
        this.state.selected = false;
    }


    componentDidMount () {
        document.body.addEventListener('mousemove', this.onMouseMove.bind(this));
        this.proxy.subscribe("SelectText", this.otherSelected.bind(this));
    }

    componentWillMount () {
        document.body.removeEventListener('mousemove', this.onMouseMove.bind(this));
    }

    otherSelected () { // allow multiple text selection
        if (!this.keyPressed[CONST.KEYCODE_ALT]){
            this.selected = false;
            this.forceUpdate();
        }
    }

    onMouseDown (event) {
        if (!this.keyPressed[CONST.KEYCODE_F]) {
            this.anchor = [event.clientX, event.clientY];
            this.oriPos = [].concat(this.state.pos);
            this.dragState = CONST.DRAG_START;

            this.proxy.trigger("SelectText", this.state);
            this.proxy.clearSubscribes("UpdateText");
            this.proxy.subscribe("UpdateText", this.update.bind(this));
            this.selected = true;
            this.forceUpdate();
        }
    }

    onMouseMove (event) {
        if (this.dragState === CONST.DRAG_START) { // / onclick
            this.dragState = CONST.DRAG_TEXT;
        }

        if (this.dragState === CONST.DRAG_TEXT) {
            let x = this.oriPos[0] + event.clientX - this.anchor[0];
            let y = this.oriPos[1] + event.clientY - this.anchor[1];
            this.state.pos = [x,y];
            this.forceUpdate();
        }
    }

    onMouseUp (event) {
        this.dragState = CONST.DRAG_NOTHING;
        this.forceUpdate();
    }

    update (newState) {
        for (let prop in newState) {
            this.state[prop] = newState[prop];
        }
        this.forceUpdate();
    }



    render () {
        let tspans = [];
        let writtingMode = "";
        let [x, y] = this.state.pos;

        // no browser support stroke-alignment yet.
        // to support outer stroke, draw two tspan for each text, one with alignment, ont without
        // todo: extract tspans generation into a function
        if (this.state.isVertical) {
            this.state.text.split("\n").forEach( (line, index) => {
                let dy = line.length - line.trim().length;
                tspans.push(<tspan stroke="#ffffff"
                                   y={y + dy*this.state.size*0.1}
                                   x={x - index*(this.state.size + this.state.lineGap)}>{line.trim()}</tspan>)
            })

            this.state.text.split("\n").forEach( (line, index) => {
                let dy = line.length - line.trim().length;
                tspans.push(<tspan y={y + dy*this.state.size*0.1}
                                   x={x - index*(this.state.size + this.state.lineGap)}>{line.trim()}</tspan>)
            })
            writtingMode = "tb";
        } else {

            // text-anchor="middle"  english layout
            this.state.text.split("\n").forEach( (line, index) => {
                let dx = line.length - line.trim().length;
                tspans.push(<tspan stroke="#ffffff"
                                   x={x + dx*this.state.size*0.1}
                                   y={y + index*this.state.size}>{line.trim()}</tspan>)
            })
            this.state.text.split("\n").forEach( (line, index) => {
                let dx = line.length - line.trim().length;
                tspans.push(<tspan x={x + dx*this.state.size*0.1}
                                   y={y + index*this.state.size}>{line.trim()}</tspan>)
            })
        }

        let selectedTag = null;
        if (this.selected) {
            selectedTag = <circle cx={x} cy={y-0.2*this.state.size} r={this.state.size*0.1} fill="red"></circle>;
        }

        return (
            <g>
                {selectedTag}
            <text style={{writingMode:writtingMode ,textOrientation: this.textOrientation}} alignmentBaseline="hanging"
                  x={x} y={y}
                  fontSize={this.state.size} fontFamily="sans-serif"

                  strokeLinejoin="round"  strokeLinecap="round" strokeWidth={this.state.strokeWidth}
                  strokeMiterlimit={200} fill="#000000"

                  transform={`rotate(${this.state.rotate} ${x}, ${y})`}

                  onMouseDown={this.onMouseDown.bind(this)}  onMouseUp={this.onMouseUp.bind(this)}
            >
                {tspans}
            </text>
            </g>
        )
    }
}

export default TextComponent;
