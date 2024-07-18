import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

class VirtualScroll extends HTMLElement {
    constructor() {
        super();
        this.itemsMap = new Map();
        this.visibleItems = new Set();
        this.itemHeight = 50; // Assuming each item is 50px height
        this.bufferSize = 5; // Number of items to buffer above and below the viewport
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    overflow-y: auto;
                    position: relative;
                    height: 100%;
                }
                .placeholder {
                    height: 1px;
                    visibility: hidden;
                }
            </style>
            <div class="content"></div>
            <div class="bottom-placeholder placeholder"></div>
        `;
    }

    connectedCallback() {
        this.style.height = this.getAttribute('height') || '500px';
        const content = this.shadowRoot.querySelector('.content');
        content.style.position = 'relative';

        this.indexItems();
        this.attachScrollListener();

        // Initial render
        this.updateVisibleItems();
    }

    indexItems() {
        const children = Array.from(this.children);
        children.forEach((child, index) => {
            this.itemsMap.set(index, child.cloneNode(true));
        });

        this.innerHTML = ''; // Clear the initial content
        const placeholderHeight = this.itemsMap.size * this.itemHeight;
        this.shadowRoot.querySelector('.bottom-placeholder').style.top = `${placeholderHeight}px`;
    }

    attachScrollListener() {
        this.addEventListener('scroll', () => {
            this.updateVisibleItems();
        });
    }

    updateVisibleItems() {
        const scrollTop = this.scrollTop;
        const visibleItemCount = Math.ceil(this.clientHeight / this.itemHeight);
        const startIndex = Math.max(0, Math.floor(scrollTop / this.itemHeight) - this.bufferSize);
        const endIndex = Math.min(this.itemsMap.size, startIndex + visibleItemCount + 2 * this.bufferSize);

        // Remove items that are no longer visible
        for (let i of Array.from(this.visibleItems)) {
            if (i < startIndex || i >= endIndex) {
                this.visibleItems.delete(i);
                const item = this.shadowRoot.querySelector(`[data-index="${i}"]`);
                if (item) {
                    this.shadowRoot.querySelector('.content').removeChild(item);
                }
            }
        }

        // Add items that should now be visible
        for (let i = startIndex; i < endIndex; i++) {
            if (!this.visibleItems.has(i)) {
                this.visibleItems.add(i);
                const item = this.itemsMap.get(i).cloneNode(true);
                item.style.position = 'absolute';
                item.style.top = `${i * this.itemHeight}px`;
                item.style.width = '100%';
                item.setAttribute('data-index', i);
                this.shadowRoot.querySelector('.content').appendChild(item);
            }
        }
    }
}

customElements.define('virtual-scroll', VirtualScroll);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
