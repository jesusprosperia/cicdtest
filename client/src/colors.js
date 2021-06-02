import { interpolateViridis } from "d3-scale-chromatic";

export const colors = {
    acceptedGreen: '#1BBC9B',
    notAccepted: '#E1E5EC',
    linkColor: '#D4DDDE',
    highlight: '#2C3E50',
    highlightLight: '#E1E5EC'
}

export const styleMap = {
    current: {
        stroke: null,
        strokeDasharray: null,
        fill: colors.acceptedGreen
    },
    original: {
        stroke: '#666',
        strokeDasharray: null,
        fill: 'transparent'
    }
}

export const colorScale = n => interpolateViridis(n);