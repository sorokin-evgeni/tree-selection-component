import './less/main.less';
import ReactDOM from 'react-dom';
import React from 'react';
import TreeSelectionComponent from './TreeSelectionComponent.jsx';

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
if (!window.console) {
    window.console = {};
}
if (!window.console.log) {
    window.console.log = function(str) {}
}


function ajaxf() {
    fetch('/api/project/list', myInit).then(function(response) {
        return response.json();
    }).then(projects => {
        console.log(projects);
        let projectsHash = {};
        projects.project.forEach(project => {
            projectsHash[project.id] = project;
        });

        function getDept(projectId) {
            if (projectsHash[projectId].parentProject) {
                return 1 + getDept(projectsHash[projectId].parentProject.id);
            }
            return 1;
        }

        let max = 0;
        projects.project.forEach(project => {
            let dept = getDept(project.id);
            if (dept > max) {
                max = dept;
            }
        });

        console.log('max dept is ' + max);
    }).catch(err => {
        setTimeout(function() {
            throw err;
        });
    });

}

// let todoIdCounter = 0;
//
// const todo = (state, action) => {
//     switch (action.type) {
//         case 'ADD_TODO':
//             return {
//                 id: action.id,
//                 text: action.text,
//                 completed: false
//             };
//         case 'TOGGLE_TODO':
//             if (state.id !== action.id) {
//                 return state;
//             }
//             return {
//                 ...state,
//                 completed: !state.completed
//             };
//     }
// };
//
// const visibilityFilter = (state = 'SHOW_ALL', action) => {
//     switch (action.type) {
//         case 'SET_VISIBILITY_FILTER':
//             return action.filter;
//         default:
//             return state;
//     }
// };
//
// const todos = function(state=[], action) {
//     switch (action.type) {
//         case 'ADD_TODO':
//             return [...state, todo(undefined, action)];
//         case 'TOGGLE_TODO':
//             return state.map((t) => todo(t, action));
//         default:
//             return state;
//     }
// };
//
// let store = createStore(combineReducers({ todos, visibilityFilter }));

class MainLayout extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            isOpened: true
        }
    }

    toggleVisibleProjects() {
        this.setState({
            isOpened: !this.state.isOpened
        });
    }

    render() {
        return (
            <div>
                <nav className="main-nav">
                    <a onClick={this.toggleVisibleProjects.bind(this)}>Configure visible Projects</a>
                </nav>
                <TreeSelectionComponent
                    isOpened={this.state.isOpened}
                    onClose={this.toggleVisibleProjects.bind(this)}
                />
            </div>
        );
    }

}

ReactDOM.render(
    <MainLayout/>,
    document.getElementById('content')
);
