document.addEventListener('DOMContentLoaded', () => {
    const expenseForm = document.getElementById('expense-form');
    const dateInput = document.getElementById('date');
    const categoryInput = document.getElementById('category');
    const amountInput = document.getElementById('amount');
    const descriptionInput = document.getElementById('description');
    const errorMessage = document.getElementById('error-message');
    
    const monthFilter = document.getElementById('month-filter');
    const totalAmountEl = document.getElementById('total-amount');
    const categoriesSummaryEl = document.getElementById('categories-summary');
    const expensesUl = document.getElementById('expenses-ul');
    const emptyState = document.getElementById('empty-state');

    // Инициализация данных из LocalStorage
    let expenses = JSON.parse(localStorage.getItem('expenses')) || [];

    // Установка дат по умолчанию
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    dateInput.value = todayStr;

    const currentMonthStr = today.toISOString().slice(0, 7);
    monthFilter.value = currentMonthStr;

    // Функции
    function saveExpenses() {
        localStorage.setItem('expenses', JSON.stringify(expenses));
    }

    function render() {
        const selectedMonth = monthFilter.value;
        if (!selectedMonth) return;

        // Фильтрация расходов по выбранному месяцу (формат YYYY-MM)
        const filteredExpenses = expenses.filter(exp => exp.date.startsWith(selectedMonth));
        
        // Сортировка по дате (от новых к старым)
        filteredExpenses.sort((a, b) => new Date(b.date) - new Date(a.date));

        // Очистка списков
        expensesUl.innerHTML = '';
        categoriesSummaryEl.innerHTML = '';

        if (filteredExpenses.length === 0) {
            emptyState.classList.remove('hidden');
            totalAmountEl.textContent = '0';
            return;
        }

        emptyState.classList.add('hidden');

        let total = 0;
        const categoryTotals = {};

        filteredExpenses.forEach(exp => {
            // Подсчет итогов
            total += exp.amount;
            categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + exp.amount;

            // Создание элемента списка
            const li = document.createElement('li');
            li.className = 'expense-card';
            li.innerHTML = `
                <div class="expense-info">
                    <div class="expense-category">${escapeHTML(exp.category)}</div>
                    <div class="expense-date">${formatDate(exp.date)}</div>
                    ${exp.description ? `<div class="expense-desc">${escapeHTML(exp.description)}</div>` : ''}
                </div>
                <div class="expense-amount-action">
                    <div class="expense-amount">${formatCurrency(exp.amount)}</div>
                    <button class="delete-btn" data-id="${exp.id}">Удалить</button>
                </div>
            `;
            expensesUl.appendChild(li);
        });

        // Обновление общего итога
        totalAmountEl.textContent = formatCurrency(total);

        // Обновление итогов по категориям
        for (const [category, amount] of Object.entries(categoryTotals)) {
            const catDiv = document.createElement('div');
            catDiv.className = 'category-item';
            catDiv.innerHTML = `
                <span>${escapeHTML(category)}</span>
                <strong>${formatCurrency(amount)}</strong>
            `;
            categoriesSummaryEl.appendChild(catDiv);
        }
    }

    function addExpense(e) {
        e.preventDefault();
        
        const date = dateInput.value;
        const category = categoryInput.value;
        const amount = parseFloat(amountInput.value);
        const description = descriptionInput.value.trim();

        if (!date || !category || isNaN(amount) || amount <= 0) {
            showError('Пожалуйста, введите корректные данные. Сумма должна быть больше 0.');
            return;
        }

        hideError();

        const newExpense = {
            id: Date.now().toString(),
            date,
            category,
            amount,
            description
        };

        expenses.push(newExpense);
        saveExpenses();
        
        // Сброс формы, кроме даты
        categoryInput.value = '';
        amountInput.value = '';
        descriptionInput.value = '';
        
        // Если добавлен расход в другой месяц, переключаем фильтр на этот месяц
        const expenseMonth = date.slice(0, 7);
        if (monthFilter.value !== expenseMonth) {
            monthFilter.value = expenseMonth;
        }

        render();
    }

    function deleteExpense(id) {
        expenses = expenses.filter(exp => exp.id !== id);
        saveExpenses();
        render();
    }

    function showError(msg) {
        errorMessage.textContent = msg;
        errorMessage.classList.remove('hidden');
    }

    function hideError() {
        errorMessage.classList.add('hidden');
    }

    function escapeHTML(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    function formatCurrency(num) {
        // Форматирование числа с пробелами в качестве разделителя тысяч
        return num.toLocaleString('ru-RU');
    }

    function formatDate(dateStr) {
        const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
        return new Date(dateStr).toLocaleDateString('ru-RU', options);
    }

    // Слушатели событий
    expenseForm.addEventListener('submit', addExpense);
    
    monthFilter.addEventListener('change', render);

    expensesUl.addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-btn')) {
            const id = e.target.getAttribute('data-id');
            deleteExpense(id);
        }
    });

    // Первоначальный рендер
    render();
});
