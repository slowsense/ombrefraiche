import { Component, Prop, Vue, Watch } from 'vue-property-decorator';
import { Shadow } from '@/components/Shadow';
import './DateExtension';

@Component
export default class ShadowSimulation extends Vue {

  public svgWidth: number = 0;
  public svgHeight: number = 0;
  public svgMin: number = 0;

  // object
  public readonly objectRadius: number = .08;

  // north indicator
  public readonly northIndicatorRadius: number = .005;
  public readonly northIndicatorRadiusOrbit: number = .480;
  public northIndicatorTransform: string = 'rotate(0)';

  // sun
  private SunCalc = require('suncalc');
  private sunPosition: any;
  public readonly sunIndicatorRadius: number = 0.02;
  private readonly sunIndicatorMaxRadiusOrbit: number = 0.3;
  public sunIndicatorRadiusOrbit: number = 0;
  public sunIndicatorTransform: string = 'rotate(0)';

  // orientation
  public currentOrientation: {
    alpha: number | null,
    beta: number | null,
    gamma: number | null} = { alpha: null, beta: null, gamma: null };

  // geoposition
  private geoPosition!: Position;
  private internalGeolocationAllowed: boolean = false;
  private internalGeolocationAvailable: boolean = true;

  // shadows
  public shadows = new Array<Shadow>();

  // component properties
  @Prop() private duration: number = 3;

  private mounted() {
    this.refreshSize();
    window.addEventListener('resize', this.refreshSize);
    window.addEventListener('deviceorientation', this.catchNewOrientation);
    this.internalGeolocationAllowed = (localStorage.getItem('geoLocationAllowed') === '1');
    if (this.internalGeolocationAllowed) {
      window.addEventListener('visibilitychange', this.refreshLocation);
      this.refreshLocation();
    }
  }

  private unmounted() {
    window.removeEventListener('resize', this.refreshSize);
    window.removeEventListener('deviceorientation', this.catchNewOrientation);
    window.removeEventListener('visibilitychange', this.refreshLocation);
  }

  private refreshSize() {
    this.svgWidth = this.getSvgWidth();
    this.svgHeight = this.getSvgHeight();
    this.svgMin = Math.min(this.svgWidth, this.svgHeight);
  }

  public geolocationAllowed(): boolean {
    return this.internalGeolocationAllowed;
  }

  public geolocationAvailable(): boolean {
    return this.internalGeolocationAvailable;
  }

  public compassAvailable(): boolean {
    return this.currentOrientation.alpha !== null;
  }

  public allowGeolocation() {
    localStorage.setItem('geoLocationAllowed', '1');
    this.internalGeolocationAllowed = true;
    this.refreshSize();
    this.refreshLocation();
    window.addEventListener('visibilitychange', this.refreshLocation);
  }

  private refreshLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        this.catchNewGeoPosition,
        () => this.internalGeolocationAvailable = false);
    }
  }

  private getSvgWidth(): number {
    const svgElement = document.getElementById('shadow-display');
    if (svgElement === null) {
      return 0;
    }
    return svgElement.getBoundingClientRect().width;
  }

  private getSvgHeight(): number {
    const svgElement = document.getElementById('shadow-display');
    if (svgElement === null) {
      return 0;
    }
    return svgElement.getBoundingClientRect().height;
  }

  private catchNewOrientation(event: DeviceOrientationEvent) {
    this.refreshSize();
    this.currentOrientation = { alpha: event.alpha, beta: event.beta, gamma: event.gamma };
    if ((event as any).webkitCompassHeading || (event as any).compassHeading) {
      this.currentOrientation.alpha = (event as any).webkitCompassHeading || (event as any).compassHeading;
    }
    this.setNorthIndicatorPosition();
    this.setSunIndicatorPosition();
    this.setShadows();
  }

  private catchNewGeoPosition(position: Position) {
    this.refreshSize();
    this.internalGeolocationAvailable = true;
    this.geoPosition = position;
    this.setNorthIndicatorPosition();
    this.setSunIndicatorPosition();
    this.setShadows();
  }

  private setNorthIndicatorPosition() {
    if (this.currentOrientation.alpha != null) {
      this.northIndicatorTransform =
        `rotate(${-this.currentOrientation.alpha}
          ${this.svgWidth / 2}
          ${this.svgHeight / 2})`;
    }
  }

  private setSunIndicatorPosition() {
    if (this.geoPosition) {
      this.sunPosition = this.SunCalc.getPosition(
        this.geoPosition.timestamp,
        this.geoPosition.coords.latitude,
        this.geoPosition.coords.longitude);
      if (this.sunPosition && this.currentOrientation.alpha) {
        this.sunIndicatorRadiusOrbit = this.sunIndicatorMaxRadiusOrbit * Math.cos(this.sunPosition.altitude);
        this.sunIndicatorTransform =
          `rotate(${((this.sunPosition.azimuth * 180) / Math.PI) - 180 - this.currentOrientation.alpha}
            ${this.svgWidth / 2}
            ${this.svgHeight / 2})`;
      }
    }
  }

  @Watch('duration')
  private durationChanged(duration: number, oldDuration: number) {
    this.setShadows();
  }

  private setShadows() {
    this.shadows = new Array<Shadow>();
    for (let index = 0; index <= this.duration; index++) {
      const shadow = this.createShadow(index);
      if (shadow != null) {
        this.shadows.push(shadow);
      }
    }
  }

  private createShadow(hourOffset: number): Shadow | null {

    if (this.currentOrientation.alpha === null) {
      return null;
    }

    const shadow = new Shadow();
    const dateOfShadow = (new Date()).addHours(hourOffset);
    const sunPosition = this.SunCalc.getPosition(
      dateOfShadow,
      this.geoPosition.coords.latitude,
      this.geoPosition.coords.longitude);
    const shadowLength: number = 4 / Math.sin(sunPosition.altitude) * (this.objectRadius / 2) * this.svgMin;
    if (shadowLength < 0) {
      return null;
    }

    shadow.centerX = this.svgWidth / 2;
    shadow.centerY = this.svgHeight / 2 - this.objectRadius * this.svgMin + (shadowLength / 2);
    shadow.radiusX = this.objectRadius * this.svgMin;
    shadow.radiusY = shadowLength / 2;
    shadow.angle = ((sunPosition.azimuth * 180) / Math.PI) - 180 - this.currentOrientation.alpha;
    shadow.transform =  `rotate(${shadow.angle}
      ${this.svgWidth / 2}
      ${this.svgHeight / 2})`;
    return shadow;
  }

}
