import { Component } from '@angular/core';

@Component({
  selector: 'dev-app',
  styleUrls: ['devapp.component.scss'],
  templateUrl: 'devapp.component.html',
})
export class DevApp {
  navItems = [
    { name: 'Alert', route: '/alert' },
    { name: 'Autocomplete', route: '/autocomplete' },
    { name: 'Bar indicator', route: '/bar-indicator' },
    { name: 'Breadcrumbs', route: '/breadcrumbs' },
    { name: 'Button', route: '/button' },
    { name: 'Button-group', route: '/button-group' },
    { name: 'Card', route: '/card' },
    { name: 'Checkbox', route: '/checkbox' },
    { name: 'Context-dialog', route: '/context-dialog' },
    { name: 'Copy-to-clipboard', route: '/copy-to-clipboard' },
    { name: 'Cta-card', route: '/cta-card' },
    { name: 'Expandable-panel', route: '/expandable-panel' },
    { name: 'Expandable-section', route: '/expandable-section' },
    { name: 'Filter-field', route: '/filter-field' },
    { name: 'Form-field', route: '/form-field' },
    { name: 'Formatters', route: '/formatters' },
    { name: 'Icon', route: '/icon' },
    { name: 'Inline-editor', route: '/inline-editor' },
    { name: 'Input', route: '/input' },
    { name: 'Key-value-list', route: '/key-value-list' },
    { name: 'Link', route: '/link' },
    { name: 'Loading-distractor', route: '/loading-distractor' },
    { name: 'Micro-chart', route: '/micro-chart' },
    { name: 'Overlay', route: '/overlay' },
    { name: 'Pagination', route: '/pagination' },
    { name: 'Progress-bar', route: '/progress-bar' },
    { name: 'Progress-circle', route: '/progress-circle' },
    { name: 'Radio', route: '/radio' },
    { name: 'Select', route: '/select' },
    { name: 'Selection-area', route: '/selection-area' },
    { name: 'Show-more', route: '/show-more' },
    { name: 'Switch', route: '/switch' },
    { name: 'Table', route: '/table' },
    { name: 'Tabs', route: '/tabs' },
    { name: 'Tag', route: '/tag' },
    { name: 'Tile', route: '/tile' },
    { name: 'Toast', route: '/toast' },
  ];
  selectedTheme = 'turquoise';
  themes = [
    { value: 'turquoise', name: 'Turquoise' },
    { value: 'blue', name: 'Blue' },
    { value: 'purple', name: 'Purple' },
    { value: 'royalblue', name: 'Royalblue' },
  ];
}