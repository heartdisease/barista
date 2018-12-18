import { Component, Type, ViewChild} from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DtChartOptions, DtChartSeries } from '@dynatrace/angular-components/chart';
import { getDtMicroChartUnsupportedChartTypeError } from './micro-chart-errors';
import { DtMicroChart } from './micro-chart';
import { Colors, DtThemingModule, DtTheme } from '@dynatrace/angular-components/theming';
import objectContaining = jasmine.objectContaining;
import { AxisOptions, DataPoint } from 'highcharts';
import { BehaviorSubject } from 'rxjs';
import { DtMicroChartModule } from '@dynatrace/angular-components/micro-chart';
import { merge } from 'lodash';

// tslint:disable:no-magic-numbers

describe('DtMicroChart', () => {

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [DtMicroChartModule, DtThemingModule],
      declarations: [
        Series,
        DefinedAxis,
        DefinedAxisArray,
        DefinedAxisEmptyArray,
        ThemeDynamic,
        ThemeFixed,
        NoOptions,
        NoSeries,
        Nothing,
        DynamicSeries,
        UnsupportedSeriesType,
      ],
    }).compileComponents();
  }));

  const setupTestCase = <T>(componentType: Type<T>):
    { fixture: ComponentFixture<T>; microChartComponent: DtMicroChart } => {
    const fixture = TestBed.createComponent(componentType);
    const microChartDebugElement = fixture.debugElement.query(By.directive(DtMicroChart));
    const microChartComponent = microChartDebugElement.componentInstance as DtMicroChart;

    return {
      fixture,
      microChartComponent,
    };
  };

  describe('hidden axis', () => {
    it('should not render axis if no axis have been defined', () => {
      const {fixture, microChartComponent} = setupTestCase(Series);
      fixture.detectChanges();

      const options = microChartComponent.highchartsOptions;

      expect(options.xAxis).toBeDefined();
      expect(options.yAxis).toBeDefined();
      expect((options.xAxis as AxisOptions).visible).toBe(false);
      expect((options.yAxis as AxisOptions).visible).toBe(false);
    });

    it('should not render axis if axis have been defined', () => {
      const {fixture, microChartComponent} = setupTestCase(DefinedAxis);
      fixture.detectChanges();

      const options = microChartComponent.highchartsOptions;

      expect(options.xAxis).toBeDefined();
      expect(options.yAxis).toBeDefined();
      expect((options.xAxis as AxisOptions).visible).toBe(false);
      expect((options.yAxis as AxisOptions).visible).toBe(false);
    });

    it('should not render axis if axis have been defined as an array', () => {
      const {fixture, microChartComponent} = setupTestCase(DefinedAxisArray);
      fixture.detectChanges();

      const options = microChartComponent.highchartsOptions;

      expect(options.xAxis).toBeDefined();
      expect(options.yAxis).toBeDefined();
      expect((options.xAxis as AxisOptions[])[0].visible).toBe(false);
      expect((options.yAxis as AxisOptions[])[0].visible).toBe(false);
    });
  });

  describe('coloring', () => {
    it('should set default colors if no theme on parent is given', () => {
      const {fixture, microChartComponent} = setupTestCase(Series);
      fixture.detectChanges();

      expect(microChartComponent.highchartsOptions.colors).toBeDefined();
    });

    it('should set colors based on the current theme', () => {
      const {fixture, microChartComponent} = setupTestCase(ThemeFixed);
      fixture.detectChanges();

      const colors = microChartComponent.highchartsOptions.colors;

      expect(colors).toBeDefined();
      expect(colors).toEqual([Colors.ROYALBLUE_400]);
    });

    it('should set colors after theme update', () => {
      const {fixture, microChartComponent} = setupTestCase(ThemeDynamic);
      fixture.detectChanges();

      fixture.componentInstance.theme = 'purple';
      fixture.detectChanges();

      const colors = microChartComponent.highchartsOptions.colors;
      expect(colors).toBeDefined();
      expect(colors).toEqual([Colors.PURPLE_400]);
    });

    it('should update minmax datapoint colors after theme update', () => {
      const {fixture, microChartComponent} = setupTestCase(ThemeDynamic);
      fixture.detectChanges();

      let data = microChartComponent.highchartsOptions.series![0].data as DataPoint[];
      expect(data[0].marker).toEqual(objectContaining({lineColor: Colors.ROYALBLUE_700}));

      fixture.componentInstance.theme = 'purple';
      fixture.detectChanges();

      data = microChartComponent.highchartsOptions.series![0].data as DataPoint[];
      expect(data[0].marker).toEqual(objectContaining({lineColor: Colors.PURPLE_700}));
    });
  });

  describe('data', () => {
    it('should return the original options unchanged passed into the chart', () => {
      const {fixture, microChartComponent} = setupTestCase(DefinedAxis);
      const optionsClone = merge({}, fixture.componentInstance.options);
      fixture.detectChanges();

      expect(microChartComponent.options).toBe(fixture.componentInstance.options);
      expect(microChartComponent.options).toEqual(optionsClone);
    });

    it('should render without options given', () => {
      const {fixture} = setupTestCase(NoOptions);
      expect(fixture.componentInstance).toBeTruthy();
    });

    it('should not crash without series', () => {
      const {fixture} = setupTestCase(NoSeries);
      expect(fixture.componentInstance).toBeTruthy();
    });

    it('should not crash with nothing provided to the chart', () => {
      const {fixture} = setupTestCase(Nothing);
      expect(fixture.componentInstance).toBeTruthy();
    });

    it('should convert static data', () => {
      const {fixture, microChartComponent} = setupTestCase(Series);
      fixture.detectChanges();

      const series = microChartComponent.highchartsOptions.series as DtChartSeries[];

      expect(series.length).toEqual(1);
      expect(series[0].data).toBeDefined();
      expect(series[0].data!.length).toBe(2);
      expect(series[0].data![0]).toEqual(objectContaining({x: 1, y: 140}));
      expect(series[0].data![1]).toEqual(objectContaining({x: 2, y: 120}));
    });

    it('should mark highest and lowest point', () => {
      const {fixture, microChartComponent} = setupTestCase(Series);
      fixture.detectChanges();

      const data = microChartComponent.highchartsOptions.series![0].data as DataPoint[];

      expect(data[0].dataLabels).toEqual(objectContaining({verticalAlign: 'bottom', enabled: true}));
      expect(data[1].dataLabels).toEqual(objectContaining({verticalAlign: 'top', enabled: true}));
    });

    it('should fetch metric ids', () => {
      const {fixture, microChartComponent} = setupTestCase(Series);
      fixture.detectChanges();

      expect(microChartComponent.seriesId).toEqual('someMetricId');
    });

    it('should convert dynamic data', () => {
      const {fixture, microChartComponent} = setupTestCase(DynamicSeries);

      fixture.detectChanges();
      expect(microChartComponent.seriesId).toEqual('someId');
      let data = microChartComponent.highchartsOptions.series![0].data as DataPoint[];
      expect(data[0]).toEqual(objectContaining({x: 1, y: 0}));
      expect(data[1]).toEqual(objectContaining({x: 2, y: 10}));

      fixture.componentInstance.emitTestData();
      expect(microChartComponent.seriesId).toEqual('someOtherId');
      data = microChartComponent.highchartsOptions.series![0].data as DataPoint[];
      expect(data[0]).toEqual(objectContaining({x: 1, y: 20}));
      expect(data[1]).toEqual(objectContaining({x: 2, y: 30}));
    });
  });

  describe('validation', () => {
    it('the correct error message is thrown', () => {
      expect(() => {
        throw getDtMicroChartUnsupportedChartTypeError('pie');
      }).toThrowError('Series type unsupported: pie');
    });

    it('should reject not allowed types', () => {
      const {fixture} = setupTestCase(Series);
      const options = fixture.componentInstance.options;
      options.chart = {};
      const cases = [ 'pie', 'funnel', 'bar', 'arearange' ];

      cases.forEach((type) => {
        options.chart!.type = type;
        expect(() => {
          fixture.detectChanges();
        }).toThrowError();
      });
    });

    it('should not throw an error with allowed types', () => {
      const {fixture} = setupTestCase(Series);
      const options = fixture.componentInstance.options;
      options.chart = {};
      const cases = ['line', 'column', undefined];

      cases.forEach((type) => {
        options.chart!.type = type;
        expect(() => {
          fixture.detectChanges();
        }).not.toThrowError();
      });
    });

    it('should throw an error if a series has an unallowed type', () => {
        const {fixture} = setupTestCase(UnsupportedSeriesType);
        expect(() => {
          fixture.detectChanges();
        }).toThrowError();
    });
  });
});

@Component({
  selector: 'dt-series-single',
  template: '<dt-micro-chart [series]="series" [options]="options"></dt-micro-chart>',
})
class Series {
  options: DtChartOptions = {chart: {type: 'line' }};
  series: DtChartSeries = {
    name: 'Actions/min',
    id: 'someMetricId',
    data: [[1, 140], [2, 120]],
  };
}

@Component({
  selector: 'dt-defined-axis',
  template: '<dt-micro-chart [series]="series" [options]="options"></dt-micro-chart>',
})
class DefinedAxis {
  options: DtChartOptions = {xAxis: {}, yAxis: {}};
  series: DtChartSeries = {
    name: 'Actions/min',
    id: 'someMetricId',
    data: [[1, 140], [2, 120]],
  };
}

@Component({
  selector: 'dt-defined-axis-array',
  template: '<dt-micro-chart [series]="series" [options]="options"></dt-micro-chart>',
})
class DefinedAxisArray {
  options: DtChartOptions = {xAxis: [{}], yAxis: [{}]};
  series: DtChartSeries = {
    name: 'Actions/min',
    id: 'someMetricId',
    data: [[1, 140], [2, 120]],
  };
}

@Component({
  selector: 'dt-defined-axis-array',
  template: '<dt-micro-chart [series]="series" [options]="options"></dt-micro-chart>',
})
class DefinedAxisEmptyArray {
  options: DtChartOptions = {xAxis: [], yAxis: []};
  series: DtChartSeries = {
    name: 'Actions/min',
    id: 'someMetricId',
    data: [[1, 140], [2, 120]],
  };
}

@Component({
  selector: 'dt-theme-dynamic',
  template: '<div [dtTheme]="theme"><dt-micro-chart [series]="series" [options]="options"></dt-micro-chart></div>',
})
class ThemeDynamic {

  @ViewChild(DtTheme) dtTheme: DtTheme;
  @ViewChild(DtMicroChart) chart: DtMicroChart;

  theme = 'blue';
  options: DtChartOptions = {};
  series: DtChartSeries = {
    name: 'Actions/min',
    id: 'someMetricId',
    data: [[1, 140], [2, 120]],
  };
}

@Component({
  selector: 'dt-theme-fixed',
  template: '<div dtTheme="blue"><dt-micro-chart [series]="series" [options]="options"></dt-micro-chart></div>',
})
class ThemeFixed {
  options: DtChartOptions = {};
  series: DtChartSeries = {
    name: 'Actions/min',
    id: 'someMetricId',
    data: [[1, 140], [2, 120]],
  };
}

@Component({
  selector: 'dt-no-options',
  template: '<dt-micro-chart [series]="series"></dt-micro-chart>',
})
class NoOptions {
  series: DtChartSeries = {
    name: 'Actions/min',
    id: 'someMetricId',
    data: [[1, 140], [2, 120]],
  };
}

@Component({
  selector: 'dt-no-series',
  template: '<dt-micro-chart [options]="options"></dt-micro-chart>',
})
class NoSeries {
  options = {};
}

@Component({
  selector: 'dt-nothing',
  template: '<dt-micro-chart></dt-micro-chart>',
})
class Nothing {}

@Component({
  selector: 'dt-dynamic-series',
  template: '<dt-micro-chart [series]="series"></dt-micro-chart>',
})
class DynamicSeries {
  series = new BehaviorSubject({
    name: 'Actions/min',
    id: 'someId',
    data: [[1, 0], [2, 10]],
  });

  emitTestData(): void {
    this.series.next({
      name: 'Actions/min',
      id: 'someOtherId',
      data: [[1, 20], [2, 30]],
    });
  }
}

@Component({
  selector: 'dt-unsupported-series-type',
  template: '<dt-micro-chart [series]="series"></dt-micro-chart>',
})
class UnsupportedSeriesType {
  series = {
    name: 'Actions/min',
    id: 'someId',
    type: 'pie',
    data: [[1, 0], [2, 10]],
  };
}