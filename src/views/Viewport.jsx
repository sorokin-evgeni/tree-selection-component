/**
 * View to output part of large list of items.
 * Handle scroll events to update visible items.
 */

import React from 'react';
import PlainTreeView from './PlainTreeView.jsx';

const itemHeight = 24;
const VIEWPORT_ITEMS_COUNT = 20;
const OFFSET_ITEMS_COUNT = 20;

export default class Viewport extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            items: this.calculateViewport(this.props.allItems, 0),
        };
    }

    getFirstVisibleItem() {
        const range = this.calculateVisibleRange(this.props.allItems, this.container.scrollTop, {offset: 0});
        return range.begin;
    }

    onItemSelect(selectedItemIndex) {
        const range = this.calculateVisibleRange(this.props.allItems, this.container.scrollTop, {offset: 0});

        if (selectedItemIndex < range.begin) {
            this.container.scrollTop = selectedItemIndex * itemHeight;
            return;
        }
        if (selectedItemIndex > range.end) {
            this.container.scrollTop = (selectedItemIndex - VIEWPORT_ITEMS_COUNT) * itemHeight;
        }
    }

    getTotalItemsHeight(itemsCount) {
        return itemsCount * itemHeight;
    }

    calculateVisibleRange(sourceArray, topOffset, {offset=OFFSET_ITEMS_COUNT}={}) {
        const elementsOffset = Math.ceil( (topOffset / this.getTotalItemsHeight(sourceArray.length)) * sourceArray.length);
        const begin = elementsOffset - offset;
        const end = elementsOffset + VIEWPORT_ITEMS_COUNT + offset - 1;
        return {
            begin: begin > 0 ? begin : 0,
            end: sourceArray.length > end ? end : sourceArray.length
        }
    }

    calculateViewport(sourceArray, topOffset) {
        const range = this.calculateVisibleRange(sourceArray, topOffset);

        return {
            items: sourceArray.slice(range.begin, range.end),
            totalHeight: this.getTotalItemsHeight(sourceArray.length),
            beginOverlayHeight: range.begin * itemHeight,
            endOverlayHeight: (sourceArray.length - range.end) * itemHeight
        }
    }

    updateViewport(items) {
        this.setState({
            items: this.calculateViewport(items || this.props.allItems, this.container.scrollTop)
        });
    }

    componentWillReceiveProps(nextProps) {
        this.updateViewport(nextProps.allItems);
    }

    render() {
        return (
            <div className="projects">
                <div className="projects__title">{this.props.title}</div>
                <div className="projects__search">
                    {this.props.searchElement}
                </div>
                <div className="projects__list-container" style={{
                    height: itemHeight * (VIEWPORT_ITEMS_COUNT + 1)
                }} ref={(container) => {
                    this.container = container;
                }} onScroll={function() {
                    this.updateViewport();
                }.bind(this)}>
                    <PlainTreeView
                        viewport={this.state.items}
                        copy={this.props.copy}
                        select={this.props.onSelect}
                        copyIcon={this.props.copyIcon}
                        selectedItemId={this.props.selectedItemId}
                        filterTextArray={this.props.filterTextArray}
                    />
                </div>
            </div>
        )
    }

}