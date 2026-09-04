import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Chart } from 'chart.js/auto';
import { Observable, tap } from 'rxjs';
import {
  AnalyticsData,
  AnalyticsManager,
} from '../../../common/services/managers/analytics/analytics';

type FeaturedMetricKey =
  | 'totalSales'
  | 'ordersToday'
  | 'activeUsers'
  | 'avgOrderValue'
  | 'conversionRate';

interface FeaturedMetricConfig {
  key: FeaturedMetricKey;
  label: string;
  description: string;
  valueType: 'currency' | 'number' | 'percent';
  helper: string;
}

@Component({
  selector: 'app-admin-analytics',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './analytics.html',
  styleUrl: './analytics.scss',
})
export class AdminAnalyticsComponent implements OnInit, OnDestroy {
  data$!: Observable<AnalyticsData>;

  readonly featuredMetrics: FeaturedMetricConfig[] = [
    {
      key: 'totalSales',
      label: 'Total Sales',
      description: 'All revenue captured from paid and fulfilled orders.',
      valueType: 'currency',
      helper: 'Revenue view',
    },
    {
      key: 'ordersToday',
      label: 'Orders Today',
      description: 'Orders created on the current day.',
      valueType: 'number',
      helper: 'Daily demand',
    },
    {
      key: 'activeUsers',
      label: 'Active Users',
      description: 'Registered users currently in the system.',
      valueType: 'number',
      helper: 'Audience size',
    },
    {
      key: 'avgOrderValue',
      label: 'Avg. Order Value',
      description: 'Average spend per order across the dataset.',
      valueType: 'currency',
      helper: 'Basket size',
    },
    {
      key: 'conversionRate',
      label: 'Conversion Rate',
      description: 'Orders compared with total users.',
      valueType: 'percent',
      helper: 'Efficiency',
    },
  ];

  selectedMetric: FeaturedMetricKey = 'totalSales';

  private salesChart!: Chart;
  private ordersChart!: Chart;

  // Trace point: constructor()
  constructor(private analyticsManager: AnalyticsManager) {}

  // Trace point: ngOnInit()
  ngOnInit(): void {
    this.analyticsManager.init();
    this.data$ = this.analyticsManager.analytics$.pipe(
      tap((data) => {
        requestAnimationFrame(() => {
          this.renderCharts(data);
        });
      })
    );
  }

  // Trace point: ngOnDestroy()
  ngOnDestroy(): void {
    if (this.salesChart) {
      this.salesChart.destroy();
    }

    if (this.ordersChart) {
      this.ordersChart.destroy();
    }
  }

  // Trace point: selectMetric()
  selectMetric(metric: FeaturedMetricKey): void {
    this.selectedMetric = metric;
  }

  // Trace point: getSelectedMetric()
  getSelectedMetric(): FeaturedMetricConfig {
    return (
      this.featuredMetrics.find((metric) => metric.key === this.selectedMetric) ??
      this.featuredMetrics[0]
    );
  }

  // Trace point: getMetricValue()
  getMetricValue(data: AnalyticsData): number {
    switch (this.selectedMetric) {
      case 'totalSales':
        return data.totalSales;
      case 'ordersToday':
        return data.ordersToday;
      case 'activeUsers':
        return data.activeUsers;
      case 'avgOrderValue':
        return data.avgOrderValue;
      case 'conversionRate':
        return data.conversionRate;
    }

    return 0;
  }

  // Trace point: getMetricDelta()
  getMetricDelta(data: AnalyticsData): string {
    switch (this.selectedMetric) {
      case 'totalSales':
        return `Up ${data.salesGrowth.toFixed(1)}% vs yesterday`;
      case 'ordersToday':
        return `Yesterday: ${data.ordersYesterday}`;
      case 'activeUsers':
        return `Growth: ${data.userGrowth.toFixed(1)}%`;
      case 'avgOrderValue':
        return `Change: ${data.avgChange.toFixed(1)}%`;
      case 'conversionRate':
        return 'Compared with active users';
    }

    return '';
  }

  // Trace point: formatMetricValue()
  formatMetricValue(data: AnalyticsData): string {
    const metric = this.getSelectedMetric();
    const value = this.getMetricValue(data);

    switch (metric.valueType) {
      case 'currency':
        return `PHP ${value.toFixed(2)}`;
      case 'percent':
        return `${value.toFixed(2)}%`;
      case 'number':
      default:
        return `${Math.round(value)}`;
    }
  }

  // Trace point: renderCharts()
  private renderCharts(data: AnalyticsData): void {
    this.createSalesChart(data);
    this.createOrdersChart(data);
  }

  // Trace point: createSalesChart()
  private createSalesChart(data: AnalyticsData): void {
    if (this.salesChart) {
      this.salesChart.destroy();
    }

    this.salesChart = new Chart('salesChart', {
      type: 'line',
      data: {
        labels: data.weeklySales.map((entry) => entry.date),
        datasets: [
          {
            label: 'Sales (PHP)',
            data: data.weeklySales.map((entry) => entry.total),
            borderColor: '#a16207',
            backgroundColor: 'rgba(161, 98, 7, 0.15)',
            tension: 0.4,
            fill: true,
            pointBackgroundColor: '#5c4033',
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
        },
      },
    });
  }

  // Trace point: createOrdersChart()
  private createOrdersChart(data: AnalyticsData): void {
    if (this.ordersChart) {
      this.ordersChart.destroy();
    }

    const labels = [
      'Pending',
      'Accepted',
      'Paid',
      'Shipped',
      'Completed',
      'Cancelled',
      'Refund',
    ];

    const values = [
      data.pendingOrders,
      data.acceptedOrders,
      data.paidOrders,
      data.shippedOrders,
      data.completedOrders,
      data.cancelledOrders,
      data.refundOrders,
    ];

    this.ordersChart = new Chart('ordersChart', {
      type: 'doughnut',
      data: {
        labels,
        datasets: [
          {
            data: values,
            backgroundColor: [
              '#facc15',
              '#60a5fa',
              '#38bdf8',
              '#8b5cf6',
              '#7a9e7e',
              '#c26a5a',
              '#fb7185',
            ],
            borderWidth: 0,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'bottom',
          },
        },
      },
    });
  }
}
