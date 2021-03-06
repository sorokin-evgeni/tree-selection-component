/**
 * Just display list of items.
 */

import React from 'react';
import NodeView from './NodeView.jsx';

export default function(props) {
    if (!props.viewport.items) return null;
    return (
        <ul style={{height: props.viewport.totalHeight}}>
            <li style={{height: props.viewport.beginOverlayHeight}}></li>
            {props.viewport.items.map(item => {
                return (
                    <NodeView
                        item={item}
                        key={item.id}
                        copy={props.copy}
                        copyIcon={props.copyIcon}
                        select={props.select}
                        isSelected={props.selectedItemId === item.id}
                        filterTextArray={props.filterTextArray}
                    />
                )
            })}
            <li style={{height: props.viewport.endOverlayHeight}}></li>
        </ul>
    )
}