import {
  AfterViewInit,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  ElementRef,
  Inject,
  PLATFORM_ID,
  ViewChild
} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { isPlatformBrowser, NgForOf } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NgForOf],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class AppComponent implements AfterViewInit {
  items = Array.from({ length: 10000 }, (_, i) => `Item ${i + 1}`);

  @ViewChild('virtualScroll', { static: false }) virtualScroll?: ElementRef;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) { }

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId) && this.virtualScroll) {
      const virtualScrollElement = this.virtualScroll.nativeElement as any;

      // Wait until Angular has rendered the projected content
      setTimeout(() => {
        virtualScrollElement.indexItems();
        virtualScrollElement.updateVisibleItems();
      });
    }
  }
}
