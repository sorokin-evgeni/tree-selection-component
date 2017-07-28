import ReactDOM from 'react-dom';
import React from 'react';
import {TreeSelectionComponent} from '../src';
import Promise from 'promise-polyfill';

//IE9 hack:
window.Promise = Promise;


class MainLayout extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            isOpened: true,
            visibleProjects: []
        }
    }

    toggleVisibleProjects(isOpened) {
        this.setState({
            isOpened: isOpened === undefined ? !this.state.isOpened : isOpened
        });
    }

    save(selectedItemsIds) {
        window.localStorage.setItem('visibleProjects', JSON.stringify(selectedItemsIds));
        return Promise.resolve().then(() => {
            this.toggleVisibleProjects(false);
        });
    }

    fetch() {
        return Promise.resolve(JSON.parse(window.localStorage.getItem('visibleProjects')));
    }

    componentDidMount() {
        this.fetch().then(visibleProjects => {
            this.setState({
                visibleProjects: visibleProjects || []
            })
        })
    }

    render() {
        return (
            <div>
                <nav className="main-nav">
                    <a onClick={this.toggleVisibleProjects.bind(this)}>Configure visible Projects</a>
                </nav>
                <TreeSelectionComponent
                    isOpened={this.state.isOpened}
                    onClose={function() {
                        this.toggleVisibleProjects(false);
                    }.bind(this)}
                    onSave={this.save.bind(this)}
                    visibleItemsIds={this.state.visibleProjects}
                />
            </div>
        );
    }

}

ReactDOM.render(
    <MainLayout/>,
    document.getElementById('content')
);
