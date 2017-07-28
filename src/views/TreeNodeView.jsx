import React from 'react';

export default class TreeNodeView extends React.Component {

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