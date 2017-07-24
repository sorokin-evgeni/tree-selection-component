import React from 'react';
import Modal from './components/modal';
import Tree from './Tree';
import data from './data';
import Benchmark from './utils/Benchmark';
import debounce from 'throttle-debounce/debounce';

const ARROW_KEY = {
        37: 'left',
        38: 'up',
        39: 'right',
        40: 'down'
    },
    ENTER_KEY = 13;

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
                onClick={function(event) {
                    this.props.select(this.props.item.id);
                }.bind(this)}
            >
                <a href="#" className="material-icons projects__copy-button" onClick={function(event) {
                    this.props.copy(this.props.item.id);
                    event.preventDefault();
                    event.stopPropagation();
                }.bind(this)}>{this.props.copyIcon}</a>
                <div className="projects__project-name">
                    {this.getName.apply(this)}
                    {this.props.item.isHidden ? '[H]' : '[V]'}
                    {this.props.item.hasHiddenChildren ? '[HC]' : ''}
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

    get selectedItemCollection() {
        if (!this.selectedItem) return;
        return this.state[`${this.selectedItem.isHidden ? 'hidden' : 'visible'}Items`];
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
            itemHeight: 24,
            parentHeight: 400,
            visibleItemsCount: 20,
            offsetItemsCount: 20,
            selectedItemId: null,
            filterText: '',
            hiddenTreeViewport: {items: []},
            visibleTreeViewport: {items: []},
            visibleItems: [],
            hiddenItems: [],
            visibleScrollTop: 0,
            hiddenScrollTop: 0
        };

        this._debouncedFilter = debounce(800, this._debouncedFilter);
    }

    componentDidMount() {
        data.getProjectsAsync().then(rawData => {
            let hash = Tree.constructHash(rawData);
            let rootIds = Tree.getRootIds(rawData);
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
        this[`set${this.selectedItem.isHidden ? 'Visible' : 'Hidden'}`](this.selectedItem.id);
        let collection = this.state[[`${this.selectedItem.isHidden ? 'visible' : 'hidden'}Items`]];

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
                if (!this.selectedItem.isHidden || !this.state.visibleItems.length) break;
                this.state.visibleItems[1] && this.selectItem(this.state.visibleItems[1].id);
                break;
            case 'right':
                if (this.selectedItem.isHidden || !this.state.hiddenItems.length) break;
                this.selectItem(this.state.hiddenItems[0].id);
                break;
            case 'up':
                if (this.selectedItemIndex === 0) break;
                this.selectItem(this.selectedItemCollection[this.selectedItemIndex - 1].id);
                break;
            case 'down':
                if (this.selectedItemIndex === this.selectedItemCollection.length - 1) break;
                this.selectItem(this.selectedItemCollection[this.selectedItemIndex + 1].id);
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
            fetching: false,
            hiddenTreeViewport: this.calculateViewport(hiddenItems, this.state.hiddenScrollTop),
            visibleTreeViewport: this.calculateViewport(visibleItems, this.state.visibleScrollTop)
        });
    }

    calculateViewport(sourceArray, topOffset) {
        const totalHeight = sourceArray.length * this.state.itemHeight;
        const elementsOffset = Math.ceil( (topOffset / totalHeight) * sourceArray.length);

        const beginFull = elementsOffset - this.state.offsetItemsCount;
        const begin = beginFull > 0 ? beginFull : 0;

        const endFull = elementsOffset + this.state.visibleItemsCount + this.state.offsetItemsCount;
        const end = sourceArray.length > endFull ? endFull : sourceArray.length;

        return {
            items: sourceArray.slice(begin, end),
            totalHeight: totalHeight,
            beginOverlayHeight: begin * this.state.itemHeight,
            endOverlayHeight: (sourceArray.length - end) * this.state.itemHeight
        }
    }

    updateViewport(scrollTop, type='hidden') {
        this.setState({
            [`${type}TreeViewport`]: this.calculateViewport(this.state[`${type}Items`], scrollTop)
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
            hiddenTreeViewport: this.calculateViewport(hiddenItems, this.state.hiddenScrollTop)
        });
    }

    selectItem(itemId) {
        if (this.state.rootIds.indexOf(itemId) !== -1) return;
        this.setState({
            selectedItemId: itemId
        })
    }

    move(direction) {

        // do not move hidden items
        if (this.state.hash[this.state.selectedItemId].isHidden) return;

        let updatedHash = Tree.move(this.state.selectedItemId, direction, this.state.hash);

        // unable to move an item
        if (updatedHash === null) return;

        this.setState({
            hash: updatedHash,
            visibleItems: Tree.getVisibleItems(this.state.rootIds, updatedHash)
        })
    }


    render() {
        return (
            <Modal
                title="Configure visible projects"
                isOpened={this.props.isOpened}
                onClose={this.props.onClose}
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
                                <a className="material-icons" onClick={function(event) {
                                    this.move('up');
                                }.bind(this)}>arrow_upward</a>
                                <a className="material-icons" onClick={function(event) {
                                    this.move('down');
                                }.bind(this)}>arrow_downward</a>
                            </td>
                            <td className="projects-cell projects-cell__visible">
                                <div className="projects">
                                    <div className="projects__title">Visible projects:</div>
                                    <div className="projects__list-container" onScroll={function(event) {
                                        event.persist();
                                        this.updateViewport(event.target.scrollTop, 'visible');
                                    }.bind(this)}>
                                        <PlainTreeView
                                            viewport={this.state.visibleTreeViewport}
                                            copy={this.setHidden.bind(this)}
                                            select={this.selectItem.bind(this)}
                                            copyIcon="arrow_forward"
                                            selectedItemId={this.state.selectedItemId}
                                        />
                                    </div>
                                </div>
                            </td>
                            <td className="projects-cell projects-cell__hidden">
                                <div className="projects">
                                    <div className="projects__title">Hidden projects:</div>
                                    <div className="projects__search">
                                        <input className="input" onKeyUp={this.filter.bind(this)} onKeyDown={event => {
                                            let key = event.keyCode || event.which;
                                            if (ARROW_KEY[key]) {
                                                event.preventDefault();
                                            }
                                        }}/>
                                    </div>
                                    <div className="projects__list-container" onScroll={function(event) {
                                        event.persist();
                                        this.updateViewport(event.target.scrollTop, 'hidden');
                                    }.bind(this)}>
                                        <PlainTreeView
                                            viewport={this.state.hiddenTreeViewport}
                                            copy={this.setVisible.bind(this)}
                                            select={this.selectItem.bind(this)}
                                            copyIcon="arrow_back"
                                            selectedItemId={this.state.selectedItemId}
                                            filterTextArray={this.state.filterTextArray}
                                        />
                                    </div>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>

                <div id="console"></div>
            </Modal>
        );
    }
}