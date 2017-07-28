/**
 * Base component view
 */

import React from 'react';
import Modal from '../components/modal';
import Tree from '../model/Tree';
import ProjectsModel from '../model/Projects';
import Benchmark from '../utils/Benchmark';
import debounce from 'throttle-debounce/debounce';
import Viewport from './Viewport.jsx';
import '../less/main.less';

const ARROW_KEY = {
        37: 'left',
        38: 'up',
        39: 'right',
        40: 'down'
    },
    ENTER_KEY = 13;

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

    selectNext(startPosition, collection, isHidden) {
        for (let i = startPosition; i < collection.length; i++) {
            if (collection[i].isHidden === isHidden) {
                this.selectItem(collection[i].id);
                return;
            }
        }
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

        switch (direction) {
            case 'left':
                if (!this.selectedItem.isHidden || this.state.visibleItems.length < 2) break;
                this.selectNext(this.visibleViewport.getFirstVisibleItem() || 1, this.state.visibleItems, false);
                break;
            case 'right':
                if (this.selectedItem.isHidden || !this.state.hiddenItems.length) break;
                this.selectNext(this.hiddenViewport.getFirstVisibleItem(), this.state.hiddenItems, true);
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
                this.selectNext(this.selectedItemIndex+1, this.selectedItemCollection, this.selectedItem.isHidden);
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
            visibleItems
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
            hiddenItems
        });
    }

    selectItem(itemId, onSelect) {
        if (this.state.rootIds.indexOf(itemId) !== -1) return;
        const isEqual = itemId === this.state.selectedItemId;
        this.setState({
            selectedItemId: isEqual ? null : itemId
        }, () => {
            if (isEqual || !this.selectedItemType || !this.selectedItemIndex) return;
            this[`${this.selectedItemType}Viewport`].onItemSelect(this.selectedItemIndex);
            onSelect && onSelect();
        });
    }

    copy(itemId) {
        if (this.state.selectedItemId === itemId) {
            this.changeSelectedItemVisibility();
            return;
        }
        this.selectItem(itemId, () => {
            this.changeSelectedItemVisibility();
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
            visibleItems
        });
    }

    getProjectsListTd({type, copy, copyIcon, searchElement, filterTextArray=null}) {
        return (
            <td className={`projects-cell projects-cell__${type}`}>
                <Viewport
                    ref={viewport => {
                        this[`${type}Viewport`] = viewport;
                    }}
                    allItems={this.state[`${type}Items`]}
                    copy={this.copy.bind(this)}
                    onSelect={this.selectItem.bind(this)}
                    copyIcon={copyIcon}
                    selectedItemId={this.selectedItemType === type ? this.state.selectedItemId : null}
                    filterTextArray={filterTextArray}
                    title={type[0].toUpperCase() + type.substr(1) + ' projects'}
                    searchElement={searchElement}
                />
            </td>
        )
    }

    getSearchInput() {
        return (
            <input placeholder="Search" className="input" onKeyUp={this.filter.bind(this)} onKeyDown={event => {
                let key = event.keyCode || event.which;
                if (ARROW_KEY[key]) {
                    event.preventDefault();
                }
            }}/>
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
                className="projects-modal"
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
                            <td className="projects-form__sort-actions">
                                <a className="material-icons" onClick={this.moveUp.bind(this)}>arrow_upward</a>
                                <a className="material-icons" onClick={this.moveDown.bind(this)}>arrow_downward</a>
                            </td>
                            {this.getProjectsListTd({
                                type: 'visible',
                                copy: this.setHidden.bind(this),
                                copyIcon: 'arrow_forward',
                                searchElement: null
                            })}
                            <td className="projects-form__sort-actions"/>
                            {this.getProjectsListTd({
                                type: 'hidden',
                                copy: this.setVisible.bind(this),
                                copyIcon: 'arrow_back',
                                searchElement: this.getSearchInput(),
                                filterTextArray: this.state.filterTextArray
                            })}
                            <td className="projects-form__sort-actions"/>
                        </tr>
                    </tbody>
                </table>
            </Modal>
        );
    }
}