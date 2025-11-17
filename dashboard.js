// dashboard.js
document.addEventListener('DOMContentLoaded', () => {
    const backendUrl = 'https://edusafe-final-project-backed-production.up.railway.app';

    // Function to fetch stats and update the page
    async function loadDashboardStats() {
        try {
            const response = await fetch(`${backendUrl}/api/dashboard-stats/`);
            if (!response.ok) {
                throw new Error('Failed to load dashboard data');
            }
            const data = await response.json();

            // 1. Populate the stat cards
            document.getElementById('stat-total-reports').textContent = data.total_reports;
            document.getElementById('stat-recent-reports').textContent = data.recent_reports;
            document.getElementById('stat-resolved-reports').textContent = data.resolved_reports;
            document.getElementById('stat-in-review').textContent = data.in_review_count;

            // 2. Build the category chart
            const ctx = document.getElementById('category-chart').getContext('2d');
            new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: data.by_category.labels,
                    datasets: [{
                        label: 'Number of Reports',
                        data: data.by_category.counts,
                        backgroundColor: 'rgba(52, 152, 219, 0.6)',
                        borderColor: 'rgba(52, 152, 219, 1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                // Ensure only whole numbers
                                stepSize: 1
                            }
                        }
                    },
                    responsive: true,
                    plugins: {
                        legend: {
                            display: false
                        }
                    }
                }
            });

        } catch (error) {
            console.error('Dashboard Error:', error);
            // You could show an error message on the page
        }
    }

    loadDashboardStats();
});