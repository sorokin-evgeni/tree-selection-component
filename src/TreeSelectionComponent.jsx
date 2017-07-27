import React from 'react';
import Modal from './components/modal';
import Tree from './Tree';
import ProjectsModel from './model/Projects';
import Benchmark from './utils/Benchmark';
import debounce from 'throttle-debounce/debounce';
import './less/main.less';

//for IE9:
import 'phantomjs-polyfill/bind-polyfill.js';
import 'phantomjs-polyfill-find-index/findIndex-polyfill.js';
import 'phantomjs-polyfill-find/find-polyfill.js';
if (typeof Object.assign != 'function') {
    Object.assign = function(target, varArgs) { // .length of function is 2
        'use strict';
        if (target == null) { // TypeError if undefined or null
            throw new TypeError('Cannot convert undefined or null to object');
        }

        var to = Object(target);

        for (var index = 1; index < arguments.length; index++) {
            var nextSource = arguments[index];

            if (nextSource != null) { // Skip over if undefined or null
                for (var nextKey in nextSource) {
                    // Avoid bugs when hasOwnProperty is shadowed
                    if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
                        to[nextKey] = nextSource[nextKey];
                    }
                }
            }
        }
        return to;
    };
}

const ARROW_KEY = {
        37: 'left',
        38: 'up',
        39: 'right',
        40: 'down'
    },
    ENTER_KEY = 13,
    
    // viewport settings: 
    VIEWPORT_ITEMS_COUNT = 20,
    OFFSET_ITEMS_COUNT = 20;

// it is not const because it can be calculated if need.
let itemHeight = 24;

class TreeNodeView extends React.Component {

    highlightCall(filterArray, name, key) {
        return filterArray.length ? [...this.highlight(name, filterArray, key++)] : [name];
    }

    highlight(name, filterArraySource, key=1) {
        let filterArray = [...filterArraySource];
        let filterText = filterArray.pop();
        let filterTextIndex = name.toLowerCase().indexOf(filterText);
        if (filterTextIndex === -1) {
            return this.highlightCall(filterArray, name, key);
        }
        return [
            this.highlightCall(filterArray, name.substr(0, filterTextIndex), key),
            <span className="projects__project-name-highlight" key={key}>
                {name.substr(filterTextIndex, filterText.length)}
            </span>,
            this.highlightCall(filterArray, name.substr(filterTextIndex + filterText.length), key),
        ];
    }

    getName() {
        let name = this.props.item.name;
        if (!this.props.filterTextArray || !this.props.filterTextArray.length) {
            return name;
        }

        return this.highlight(name, this.props.filterTextArray);
    }

    render() {
        return (
            <li
                className={`level_${this.props.item.level}${this.props.isSelected ? ' projects__project-selected' : ''}`}
                onClick={function() {
                    this.props.select(this.props.item.id);
                }.bind(this)}
            >
                <a href="#" className="material-icons projects__copy-button" onClick={function(event) {
                    this.props.copy(this.props.item.id);
                    event.preventDefault();
                    event.stopPropagation();
                }.bind(this)}>{this.props.copyIcon}</a>
                <div className={`projects__project-name${this.props.item.isGhost ? ' projects__project-name_ghost' : ''}`}>
                    {this.getName.apply(this)}
                    {this.props.item.isHidden ? '[H]' : '[V]'}
                    {this.props.item.hasHiddenChildren ? '[HC]' : ''}
                    {this.props.item.isGhost ? '[G]' : ''}
                </div>
            </li>
        );
    }
}

class PlainTreeView extends React.Component {

    render() {
        if (!this.props.viewport.items) return null;
        return (
            <ul style={{height: this.props.viewport.totalHeight}}>
                <li style={{height: this.props.viewport.beginOverlayHeight}}></li>
                {this.props.viewport.items.map(item => {
                    return (
                        <TreeNodeView
                            item={item}
                            key={item.id}
                            copy={this.props.copy}
                            copyIcon={this.props.copyIcon}
                            select={this.props.select}
                            isSelected={this.props.selectedItemId === item.id}
                            filterTextArray={this.props.filterTextArray}
                        />
                    )
                })}
                <li style={{height: this.props.viewport.endOverlayHeight}}></li>
            </ul>
        )
    }
}

export default class TreeSelectionComponent extends React.Component {

    get selectedItem() {
        return this.state.hash[this.state.selectedItemId];
    }

    get selectedItemType() {
        if (!this.selectedItem) return;
        return this.selectedItem.isHidden ? 'hidden' : 'visible';
    }

    get selectedItemCollection() {
        return this.state[`${this.selectedItemType}Items`];
    }

    get selectedItemIndex() {
        if (!this.selectedItemCollection) return -1;
        return this.selectedItemCollection.findIndex(item => item.id === this.state.selectedItemId);
    }

    constructor(props) {
        super(props);
        this.state = {
            fetching: true,
            rootIds: [],
            hash: {},
            selectedItemId: null,
            filterText: '',
            hiddenTreeViewport: {items: []},
            visibleTreeViewport: {items: []},
            visibleItems: [],
            hiddenItems: []
        };

        this._debouncedFilter = debounce(800, this._debouncedFilter);
    }

    componentDidMount() {
        ProjectsModel.getProjectsAsync().then(rawData => {
            let hash = Tree.constructHash(rawData);
            let rootIds = Tree.getRootIds(rawData);
            if (this.props.visibleItemsIds && this.props.visibleItemsIds.length) {
                hash = Tree.setVisibleItems(rootIds, hash, this.props.visibleItemsIds);
            }
            this.setState({
                rootIds
            });
            this.updateTrees(hash);
        }).catch(err => {
            setTimeout(() => {
                throw err;
            });
        });

        this.documentKeydownHandler = event => {
            let key = event.keyCode || event.which;

            if (ARROW_KEY[key] !== undefined) {
                this.moveSelectionCursor(ARROW_KEY[key]);
                event.preventDefault();
                return;
            }

            if (key === ENTER_KEY) {
                this.changeSelectedItemVisibility();
                return;
            }

        };
        document.addEventListener('keydown', this.documentKeydownHandler);
    }

    changeSelectedItemVisibility() {

        //calc item which will be selected:
        let selectedItemIndex = this.selectedItemIndex;
        if (selectedItemIndex === -1) return;
        let previousType = this.selectedItemType;
        const capitalizedType = this.selectedItem.isHidden ? 'Visible' : 'Hidden';
        this[`set${capitalizedType}`](this.selectedItem.id);
        let collection = this.state[[`${previousType}Items`]];


        this.selectItem(
            collection[selectedItemIndex]
                ? collection[selectedItemIndex].id
                : collection[selectedItemIndex - 1]
                    ? collection[selectedItemIndex - 1].id
                    : null
        );
    }

    moveSelectionCursor(direction) {
        if (!this.state.selectedItemId) {
            this.setState({
                selectedItemId: this.state.hiddenItems.length ? this.state.hiddenItems[0].id : this.state.visibleItems[1].id
            });
            return;
        }

        let range;
        switch (direction) {
            case 'left':
                if (!this.selectedItem.isHidden || this.state.visibleItems.length < 2) break;
                range = this.calculateVisibleRange(this.state.visibleItems, this.visibleContainer.scrollTop, {offset: 0});
                this.selectItem(this.state.visibleItems[range.begin || 1].id);
                break;
            case 'right':
                if (this.selectedItem.isHidden || !this.state.hiddenItems.length) break;
                range = this.calculateVisibleRange(this.state.hiddenItems, this.hiddenContainer.scrollTop, {offset: 0});
                this.selectItem(this.state.hiddenItems[range.begin].id);
                break;
            case 'up':
                if (this.selectedItemIndex === 0) break;
                for (let i = this.selectedItemIndex - 1; i>=0; i--) {
                    if (this.selectedItemCollection[i].isHidden === this.selectedItem.isHidden) {
                        this.selectItem(this.selectedItemCollection[i].id);
                        break;
                    }
                }
                break;
            case 'down':
                if (this.selectedItemIndex === this.selectedItemCollection.length - 1) break;
                for (let i = this.selectedItemIndex + 1; i < this.selectedItemCollection.length; i++) {
                    if (this.selectedItemCollection[i].isHidden === this.selectedItem.isHidden) {
                        this.selectItem(this.selectedItemCollection[i].id);
                        break;
                    }
                }
                break;
            default:
                throw `TreeSelectionComponent.moveSelectionCursor: Invalid direction passed: ${direction}`;
        }
    }

    componentWillUnmount() {
        this.documentKeydownHandler && document.removeEventListener('keydown', this.documentKeydownHandler);
    }

    updateTrees(hash) {
        let query = this.state.filterText ? this.state.filterTextArray : '';
        let hiddenItems = Tree.getHiddenItems(this.state.rootIds, hash, {query});
        let visibleItems = Tree.getVisibleItems(this.state.rootIds, hash);

        this.setState({
            hash,
            hiddenItems,
            visibleItems,
            hiddenTreeViewport: this.calculateViewport(hiddenItems, this.hiddenContainer.scrollTop),
            visibleTreeViewport: this.calculateViewport(visibleItems, this.visibleContainer.scrollTop)
        });
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

    updateViewport(type='hidden') {
        this.setState({
            [`${type}TreeViewport`]: this.calculateViewport(this.state[`${type}Items`], this[`${type}Container`].scrollTop)
        });
    }

    setVisible(itemId) {
        this.updateTrees(Tree.setVisible(itemId, this.state.hash));
    }

    setHidden(itemId) {
        this.updateTrees(Tree.setHidden(itemId, this.state.hash));
    }

    hideLoader() {
        if (!this.loader) return;
        this.loader.setAttribute('style', 'display: none');
    }

    componentWillUpdate() {
        Benchmark.start('render');
    }

    componentDidUpdate() {
        this.hideLoader();
        Benchmark.stop('render');
    }

    filter(event) {
        event.persist();
        this._debouncedFilter(event);
    }

    _debouncedFilter(event) {
        let filterText = event.target.value.toLowerCase();
        if (filterText.length < 2) {
            filterText = '';
        }
        if (this.state.filterText === filterText) return;
        let filterTextArray = filterText.split(/\s+/);
        let hiddenItems = Tree.getHiddenItems(this.state.rootIds, this.state.hash, {query: filterTextArray});
        this.setState({
            filterText,
            filterTextArray,
            hiddenItems,
            hiddenTreeViewport: this.calculateViewport(hiddenItems, this.hiddenContainer.scrollTop)
        });
    }

    selectItem(itemId) {
        if (this.state.rootIds.indexOf(itemId) !== -1) return;
        this.setState({
            selectedItemId: itemId
        }, () => {
            const container = this[`${this.selectedItemType}Container`];
            const range = this.calculateVisibleRange(
                this.selectedItemCollection,
                container.scrollTop,
                {offset: 0}
            );

            if (this.selectedItemIndex < range.begin) {
                container.scrollTop = this.selectedItemIndex * itemHeight;
                return;
            }
            if (this.selectedItemIndex > range.end) {
                container.scrollTop =
                    (this.selectedItemIndex - VIEWPORT_ITEMS_COUNT) * itemHeight;
            }
        });
    }

    moveDown() {
        this._move('down');
    }

    moveUp() {
        this._move('up');
    }

    _move(direction) {

        // do not move hidden items
        if (this.state.hash[this.state.selectedItemId].isHidden) return;

        let updatedHash = Tree.move(this.state.selectedItemId, direction, this.state.hash);

        // unable to move an item
        if (updatedHash === null) return;

        let visibleItems = Tree.getVisibleItems(this.state.rootIds, updatedHash);
        this.setState({
            hash: updatedHash,
            visibleItems,
            visibleTreeViewport: this.calculateViewport(visibleItems, this.visibleContainer.scrollTop)
        });
    }

    getProjectsListTd({type, copy, copyIcon, searchElement, filterTextArray=null}) {
        const capitalizedType = type[0].toUpperCase() + type.substr(1);
        return (
            <td className={`projects-cell projects-cell__${type}`}>
                <div className="projects">
                    <div className="projects__title">{capitalizedType} projects:</div>
                    {searchElement}
                    <div className="projects__list-container" style={{
                        height: itemHeight * (VIEWPORT_ITEMS_COUNT + 1)
                    }} ref={(container) => {
                        this[`${type}Container`] = container;
                    }} onScroll={function() {
                        this.updateViewport(type);
                    }.bind(this)}>
                        <PlainTreeView
                            viewport={this.state[`${type}TreeViewport`]}
                            copy={copy}
                            select={this.selectItem.bind(this)}
                            copyIcon={copyIcon}
                            selectedItemId={this.selectedItemType === type ? this.state.selectedItemId : null}
                            filterTextArray={filterTextArray}
                        />
                    </div>
                </div>
            </td>
        )
    }

    getSearchInput() {
        return (
            <div className="projects__search">
                <input className="input" onKeyUp={this.filter.bind(this)} onKeyDown={event => {
                    let key = event.keyCode || event.which;
                    if (ARROW_KEY[key]) {
                        event.preventDefault();
                    }
                }}/>
            </div>
        )
    }

    save() {
        this.props.onSave(Tree.getVisibleItemsIds(this.state.rootIds, this.state.hash));
    }

    render() {
        return (
            <Modal
                title="Configure visible projects"
                isOpened={this.props.isOpened}
                onClose={this.props.onClose}
                onSave={this.save.bind(this)}
            >
                <div className="projects-form__loading" ref={(loader) => { this.loader = loader; }}>
                    <div className="projects-form__loading-overlay"></div>
                    <div className="projects-form__loading-text">
                        Loading...
                    </div>
                </div>
                <table>
                    <tbody>
                        <tr>
                            <td>
                                <a className="material-icons" onClick={this.moveUp.bind(this)}>arrow_upward</a>
                                <a className="material-icons" onClick={this.moveDown.bind(this)}>arrow_downward</a>
                            </td>
                            {this.getProjectsListTd({
                                type: 'visible',
                                copy: this.setHidden.bind(this),
                                copyIcon: 'arrow_forward',
                                searchElement: null
                            })}
                            {this.getProjectsListTd({
                                type: 'hidden',
                                copy: this.setVisible.bind(this),
                                copyIcon: 'arrow_back',
                                searchElement: this.getSearchInput(),
                                filterTextArray: this.state.filterTextArray
                            })}
                        </tr>
                    </tbody>
                </table>

                <div id="console"></div>
            </Modal>
        );
    }
}