import React from 'react';

class Modal extends React.Component {

    render() {

        if (!this.props.isOpened) {
            return null;
        }

        return (
            <div className="modal-wrapper">
                <div className="modal-wrapper__overlay"></div>
                <div className={`modal ${this.props.className || ''}`}>
                    <header className="modal__header">
                        {this.props.title}
                        <a className="material-icons modal__close" onClick={this.props.onClose}>close</a>
                    </header>
                    <section className="modal__section projects-form">
                        {this.props.children}
                    </section>
                    <footer className="modal__footer">
                        <button className="button js-cancel" onClick={this.props.onClose}>Close</button>
                        <button className="button button-action js-save"onClick={this.props.onSave}>Save</button>
                    </footer>
                </div>
            </div>
        );
    }

}

export default Modal;