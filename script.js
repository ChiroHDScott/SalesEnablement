document.addEventListener('DOMContentLoaded', () => {
    const toggle = document.getElementById('billing-toggle');
    const monthlyLabel = document.getElementById('monthly-label');
    const annualLabel = document.getElementById('annual-label');
    const prices = document.querySelectorAll('.price');

    let isAnnual = true; // Default to Annual now

    toggle.addEventListener('click', () => {
        isAnnual = !isAnnual;

        toggle.classList.toggle('active');
        monthlyLabel.classList.toggle('active');
        annualLabel.classList.toggle('active');

        // Note: remove old logic about adding/removing specific classes manually to clean it up
        /* 
        if (isAnnual) {
            toggle.classList.add('active');
            monthlyLabel.classList.remove('active');
        } else {
            toggle.classList.remove('active');
            monthlyLabel.classList.add('active');
        } 
        */

        updatePrices(isAnnual);
    });

    function updatePrices(annual) {
        prices.forEach(priceEl => {
            const amount = annual
                ? priceEl.getAttribute('data-annual')
                : priceEl.getAttribute('data-monthly');

            // animate change (optional)
            priceEl.style.opacity = 0;
            setTimeout(() => {
                priceEl.textContent = amount;
                priceEl.style.opacity = 1;
            }, 150);
        });
    }
});
