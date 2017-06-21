﻿/// <reference path="../node_modules/@types/d3/index.d.ts" />

const FLOW_DEFAULTS: any = {
    DefaultAnchorNodeSpacing: 50,
    DefaultCurveColor: '#6dc1ff',
    ShowPlanarMid: false,
    ShowCurveAnchors: false,
    DefaultNodeColor: '#007c6',
    DefaultContainerHeightFraction: 1,
    ShowEventBoxes: true,
    DefaultCurveIsSolid: false,
    DefaultCuveStrokeDasharray: '2, 2'
}

class FlowBoxNode {
    lower: string;
    upper: string;
    nodeColor: string;
    constructor(lower = '', upper = '', color = FLOW_DEFAULTS.DefaultNodeColor) {
        this.lower = lower;
        this.upper = upper;
        this.nodeColor = color;
    }
}

class FlowBox {
    private eventBoxContainer: any;
    private container: d3.Selection<any, any, null, undefined>;
    private svg: d3.Selection<any, any, null, undefined>;
    private containerWidth: number;
    private containerHeight: number;
    private planarY: number;
    private planarMidPath: d3.Selection<any, any, null, undefined>;
    private curve: d3.Selection<any, any, null, undefined>;
    private anchors: any[] = [];
    private lastAnchorAtLength: any = null;
    private curveAnchors: any = [];
    private lastCurveAnchor: any = null;
    private lastAnchor: any;
    private lastAnchorAlignedLeft: any;
    private DEFAULTS: any;
    constructor(defaults: any, _containerId: string, nodes: FlowBoxNode[]) {
        const self = this;
        self.DEFAULTS = defaults;
        self.container = d3.select(document.getElementById(_containerId));
        self.container.node().classList.add('flow-box-container');
        let _width = (self.container.node().getBoundingClientRect() as ClientRect).width;
        self.containerWidth = _width;
        let _height = window.innerHeight;
        if (self.DEFAULTS.DefaultContainerHeightFraction !== 1) {
            self.containerHeight = _height * self.DEFAULTS.DefaultContainerHeightFraction;
            self.container.node().style.height = self.containerHeight + 'px';
        } else {
            self.containerHeight = self.container.node().getBoundingClientRect().height;
        }
        self.planarY = self.containerHeight * 0.50;
        setTimeout(() => {
            self.svg = self.container.append('svg')
                .attr('width', _width)
                .attr('height', self.containerHeight);
            setTimeout(() => {
                self.extendPlanarCurve();
                self.DEFAULTS.ShowPlanarMid && self.drawPlanarMidLine();
                nodes.length > 0 && self.initNodes(nodes);
            });
        })
    }
    initNodes(nodes: FlowBoxNode[]) {
        const self = this;
        nodes.forEach((node: FlowBoxNode) => {
            self.addAnchor(node);
        });
    }
    extendPlanarCurve() {
        const self = this;
        if (self.lastCurveAnchor == null) {
            self.curveAnchors.push([0, self.planarY + 100]);
            self.lastCurveAnchor = [0, self.planarY + 100];
        }
        let x, y;
        let heightDiffer = self.containerHeight / 5;
        self.insertIntoCurveAnchor(self.lastCurveAnchor[0] + 200, self.planarY - (heightDiffer * 1));
        self.insertIntoCurveAnchor(self.lastCurveAnchor[0] + 300, self.planarY - (heightDiffer * 2));
        self.insertIntoCurveAnchor(self.lastCurveAnchor[0] + 50, self.planarY + (heightDiffer * 1.5));
        self.insertIntoCurveAnchor(self.lastCurveAnchor[0] + 200, self.planarY + (heightDiffer * 1.70));
        self.insertIntoCurveAnchor(self.lastCurveAnchor[0] + 200, self.planarY - (heightDiffer * 1.5));
        self.insertIntoCurveAnchor(self.lastCurveAnchor[0] + 200, self.planarY - (heightDiffer * 1.70));
        self.insertIntoCurveAnchor(self.lastCurveAnchor[0] + 50, self.planarY + (heightDiffer));
        self.insertIntoCurveAnchor(self.lastCurveAnchor[0] + 150, self.planarY + (heightDiffer * 1.50));
        self.insertIntoCurveAnchor(self.lastCurveAnchor[0] + 200, self.planarY);
        self.drawPlanarCurve();
    }
    insertIntoCurveAnchor(x: number, y: number) {
        const self = this;
        self.curveAnchors.push([x, y]);
        self.lastCurveAnchor = [x, y];
    }
    drawPlanarCurve() {
        const self = this;
        self.curveAnchors.forEach((_point: any) => {
            self.containerWidth = self.containerWidth > _point[0] ? self.containerWidth : _point[0];
            self.svg.attr('width', self.containerWidth);
            self.DEFAULTS.ShowCurveAnchors && self.svg.append('circle')
                .attr('cx', _point[0])
                .attr('cy', _point[1])
                .attr('r', 5)
                .attr('fill', '#000');
        });
        self.curve && self.curve.remove();
        self.curve = self.svg.append('path')
            .data([self.curveAnchors])
            .attr('d', d3.line().curve(d3.curveBasis))
            .attr('stroke-width', 2)
            .attr('stroke', self.DEFAULTS.DefaultCurveColor)
            .attr('stroke-dasharray', self.DEFAULTS.DefaultCurveIsSolid === true ? '0, 0' : self.DEFAULTS.DefaultCuveStrokeDasharray)
            .attr('fill', 'none')
    }
    drawPlanarMidLine() {
        const self = this;
        self.planarMidPath = self.svg.append("line")
            .attr('x1', 0)
            .attr('y1', self.planarY)
            .attr('x2', self.containerWidth)
            .attr('y2', self.planarY)
            .attr('stroke-width', 1)
            .attr('stroke', '#e74c3c');
    }
    addAnchor(node: FlowBoxNode) {
        const self = this;
        let planarExtended = false;
        let _totalPathLength = self.curve.node().getTotalLength();
        if (!self.lastAnchorAtLength) {
            self.lastAnchorAtLength = 0;
            self.lastAnchor = { 'x': -50, 'y': 0 };
            self.lastAnchorAtLength = self.lastAnchorAtLength + 100;
        } else {
            self.lastAnchor = self.curve.node().getPointAtLength(self.lastAnchorAtLength);
            self.lastAnchorAtLength = self.lastAnchorAtLength + self.DEFAULTS.DefaultAnchorNodeSpacing;
        }
        let _anchor;
        _anchor = self.curve.node().getPointAtLength(self.lastAnchorAtLength);
        // MAKE SURE HORIZONTAL DIFF TO LAST ANCHOR IS AT LEAST 100
        if (Math.abs(_anchor['y'] - self.lastAnchor['y']) < 100) {
            let diffToCompare = self.lastAnchorAlignedLeft ? 220 : 130;
            while (_anchor['x'] - self.lastAnchor['x'] <= diffToCompare) {
                self.lastAnchorAtLength = self.lastAnchorAtLength + 25;
                if (!planarExtended && (self.lastAnchorAtLength > _totalPathLength)) {
                    self.extendPlanarCurve();
                    planarExtended = true;
                }
                _anchor = self.curve.node().getPointAtLength(self.lastAnchorAtLength);
            }
        }
        if (_anchor) {
            self.svg.append('circle')
                .attr('cx', _anchor['x'])
                .attr('cy', _anchor['y'])
                .attr('r', 5)
                .attr('fill', node.nodeColor);
            self.svg.append('circle')
                .attr('cx', _anchor['x'])
                .attr('cy', _anchor['y'])
                .attr('r', 10)
                .attr('stroke-width', 3)
                .attr('stroke', node.nodeColor)
                .attr('fill', 'none');
            self.anchors.push(_anchor);
            let _anchorNextForSlope = self.curve.node().getPointAtLength(self.lastAnchorAtLength + 1);
            let slope = (_anchorNextForSlope['y'] - _anchor['y']) / (_anchorNextForSlope['x'] - _anchor['x']);
            let top, left;
            let position = '';
            if (Math.abs(slope) < 1) {
                let topOffset = self.DEFAULTS.ShowEventBoxes ? 145 : 130;
                let bottomOffset = self.DEFAULTS.ShowEventBoxes ? 25 : 10;
                top = (slope < 0 ? _anchor['y'] - topOffset : _anchor['y'] + bottomOffset);
                position = slope < 0 ? 'top' : 'bottom';
                if ((top + 120 > self.containerHeight) || (top < 0)) {
                    top = (slope < 0 ? _anchor['y'] + bottomOffset : _anchor['y'] - topOffset);
                    position = slope < 0 ? 'bottom' : 'top';
                }
                // LEFT ADJUSTED BY HALF OF BOX WITH
                left = (_anchor['x'] - 60);
                self.lastAnchorAlignedLeft = false;
            } else {
                let leftOffset = self.DEFAULTS.ShowEventBoxes ? 30 : 15;
                top = (_anchor['y'] - 70);
                left = (_anchor['x'] + leftOffset);
                self.lastAnchorAlignedLeft = true;
                position = 'right';
            }
            let eventBox: d3.Selection<any, any, null, undefined> = self.container.append('div');
            eventBox.node().classList.add('flow-box-event-container');
            eventBox.node().style.top = top + 'px';
            eventBox.node().style.left = left + 'px';
            let imgBox: d3.Selection<any, any, null, undefined> = eventBox.append('div');
            imgBox.node().innerHTML = node.upper;
            let textBox: d3.Selection<any, any, null, undefined> = eventBox.append('div');
            textBox.node().classList.add('flow-box-event-text');
            textBox.node().innerHTML = node.lower;

            if (self.DEFAULTS.ShowEventBoxes) {
                let arrowInBox: d3.Selection<any, any, null, undefined> = eventBox.append('div');
                eventBox.attr('data-color', node.nodeColor);
                eventBox.node().style.background = LightenDarkenColor(node.nodeColor, 120);
                eventBox.node().style.borderColor = node.nodeColor;
                arrowInBox.node().classList.add(position + '-side-arrow');
                if (position === 'top')
                    arrowInBox.node().style.borderTopColor = node.nodeColor;
                else if (position === 'bottom')
                    arrowInBox.node().style.borderBottomColor = node.nodeColor;
                else if (position === 'right')
                    arrowInBox.node().style.borderRightColor = node.nodeColor;
                textBox.node().style.background = node.nodeColor;
                textBox.node().style.color = '#FFF';
            }
        }
    }
}

function LightenDarkenColor(col: any, amt: any) {
    var usePound = false;
    if (col[0] == "#") {
        col = col.slice(1);
        usePound = true;
    }
    var num = parseInt(col,16);
    var r = (num >> 16) + amt;
    if (r > 255) r = 255;
    else if  (r < 0) r = 0;
    var b = ((num >> 8) & 0x00FF) + amt; 
    if (b > 255) b = 255;
    else if  (b < 0) b = 0;
    var g = (num & 0x0000FF) + amt; 
    if (g > 255) g = 255;
    else if (g < 0) g = 0;
    return (usePound?"#":"") + (g | (b << 8) | (r << 16)).toString(16);  
}


function hexToRgb(hex: string) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}