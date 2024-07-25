import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

class VirtualScroll extends HTMLElement {
    constructor() {
        super();
        this.itemsMap = [];
        this.visibleItems = new Set();
        this.itemHeights = [];
        this.bufferSize = 10; // Количество элементов для буфера (выше и ниже области просмотра)
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    overflow-y: auto;
                    position: relative;
                    height: 100%;
                }
                .content {
                    position: relative;
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
        this.indexItems();
        this.updateVisibleItems();
        this.attachScrollListener();
    }

    indexItems() {
        const children = Array.from(this.children);
        this.itemsMap = children.map(child => child.cloneNode(true)); // Сохраняем оригинал
        this.itemHeights = new Array(children.length).fill(0); // Инициализация высот

        // Placeholder для общего высоты
        this.updatePlaceholderHeight();
    }

    updatePlaceholderHeight() {
        const totalHeight = this.itemHeights.reduce((sum, height) => sum + height, 0);
        this.shadowRoot.querySelector('.bottom-placeholder').style.height = `${totalHeight}px`;
    }

    attachScrollListener() {
        this.addEventListener('scroll', () => {
            this.updateVisibleItems();
        });
    }

    updateVisibleItems() {
        const scrollTop = this.scrollTop;
        const clientHeight = this.clientHeight;
        const startIndex = this.getStartIndex(scrollTop);
        const endIndex = this.getEndIndex(scrollTop + clientHeight);

        // Удаляем элементы, которые больше не видны
        this.removeInvisibleItems(startIndex, endIndex);

        // Добавляем элементы, которые теперь должны быть видны
        this.renderVisibleItems(startIndex, endIndex);
    }

    getStartIndex(scrollTop) {
        let totalHeight = 0;
        for (let i = 0; i < this.itemHeights.length; i++) {
            totalHeight += this.getItemHeight(i);
            if (totalHeight > scrollTop) {
                return i;
            }
        }
        return this.itemHeights.length - 1; // Возвращаем последний индекс, если ничего не найдено
    }

    getEndIndex(scrollTop) {
        let totalHeight = 0;
        for (let i = 0; i < this.itemHeights.length; i++) {
            totalHeight += this.getItemHeight(i);
            if (totalHeight > scrollTop) {
                return i + Math.ceil(this.clientHeight / Math.min(...this.itemHeights.filter(h => h > 0))) + this.bufferSize;
            }
        }
        return this.itemHeights.length - 1; // Возвращаем последний индекс
    }

    removeInvisibleItems(startIndex, endIndex) {
        for (let i of Array.from(this.visibleItems)) {
            if (i < startIndex || i >= endIndex) {
                this.visibleItems.delete(i);
                const item = this.shadowRoot.querySelector(`[data-index="${i}"]`);
                if (item) {
                    this.shadowRoot.querySelector('.content').removeChild(item);
                }
            }
        }
    }

    renderVisibleItems(startIndex, endIndex) {
        const content = this.shadowRoot.querySelector('.content');
        const fragment = document.createDocumentFragment(); // Используем DocumentFragment для оптимизации

        for (let i = startIndex; i < endIndex; i++) {
            if (!this.visibleItems.has(i)) {
                this.visibleItems.add(i);

                // Создаем визуализируемый элемент
                const item = this.itemsMap[i].cloneNode(true);
                item.style.position = 'absolute';
                item.style.top = `${this.getAccumulatedHeight(i)}px`; // Учитываем высоты всех предыдущих элементов
                item.style.width = '100%';
                item.setAttribute('data-index', i);
                fragment.appendChild(item); // Добавляем элемент во фрагмент
            }
        }
        content.appendChild(fragment); // Добавляем все элементы за один раз
    }

    getAccumulatedHeight(index) {
        // Возвращает общую высоту всех предыдущих элементов
        return this.itemHeights.slice(0, index).reduce((sum, height) => sum + height, 0);
    }

    // Метод для получения высоты элемента, если она еще не вычислена
    getItemHeight(index) {
        if (this.itemHeights[index] === 0) {
            const tempElement = this.itemsMap[index].cloneNode(true);
            tempElement.style.position = 'absolute';
            tempElement.style.visibility = 'hidden';
            document.body.appendChild(tempElement);
            const height = tempElement.offsetHeight;
            this.itemHeights[index] = height; // Сохраняем высоту для дальнейшего использования
            document.body.removeChild(tempElement);
        }
        return this.itemHeights[index];
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
