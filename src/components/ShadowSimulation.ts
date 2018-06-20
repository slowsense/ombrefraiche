import { Component, Prop, Vue, Watch } from 'vue-property-decorator';
import { Shadow } from '@/components/Shadow';

@Component
export default class ShadowSimulation extends Vue {

  public svgWidth: number = 0;
  public svgHeight: number = 0;
  public svgMin: number = 0;

  // object
  public readonly objectRadius: number = .04;

  // north indicator
  public readonly northIndicatorRadius: number = .005;
  private readonly northIndicatorRadiusOrbit: number = .7;
  public northIndicatorX: number = 0;
  public northIndicatorY: number = 0;

  // sun
  private SunCalc = require('suncalc');
  public readonly sunIndicatorRadius: number = 0.02;
  private readonly sunIndicatorRadiusOrbit: number = 0.6;
  private sunPosition: any;
  public sunIndicatorX: number = 0;
  public sunIndicatorY: number = 0;

  // orientation
  private currentOrientation: {
    alpha: number | null,
    beta: number | null,
    gamma: number | null} = { alpha: null, beta: null, gamma: null };

  // geoposition
  private geoPosition!: Position;
  private watchIdentifier!: number;

  // shadows
  public shadows = new Array<Shadow>();

  // component properties
  @Prop() private duration: number = 3;

  private mounted() {
    this.refreshSize();
    window.addEventListener('resize', this.refreshSize);
    window.addEventListener('deviceorientation', this.catchNewOrientation);
    if (navigator.geolocation) {
      this.watchIdentifier = navigator.geolocation.watchPosition(this.catchNewGeoPosition);
    }
  }

  private unmounted() {
    window.removeEventListener('resize', this.refreshSize);
    window.removeEventListener('deviceorientation', this.catchNewOrientation);
    if (this.watchIdentifier) {
      navigator.geolocation.clearWatch(this.watchIdentifier);
    }
  }

  private refreshSize() {
    this.svgWidth = this.getSvgWidth();
    this.svgHeight = this.getSvgHeight();
    this.svgMin = Math.min(this.svgWidth, this.svgHeight);
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
    this.currentOrientation = { alpha: event.alpha, beta: event.beta, gamma: event.gamma };
    if ((event as any).webkitCompassHeading) {
      this.currentOrientation.alpha = (event as any).webkitCompassHeading;
    }
    this.setNorthIndicatorPosition();
    this.setSunIndicatorPosition();
    this.setShadows();
  }

  private catchNewGeoPosition(position: Position) {
    this.geoPosition = position;
    this.setNorthIndicatorPosition();
    this.setSunIndicatorPosition();
    // this.setShadows();
  }

  private setNorthIndicatorPosition() {
    if (this.currentOrientation.alpha != null) {
      this.northIndicatorX = this.svgWidth / 2
        + Math.cos(-this.toTrigonometricAngle(this.currentOrientation.alpha))
        * this.northIndicatorRadiusOrbit
        * (this.svgMin / 2);
      this.northIndicatorY = this.svgHeight / 2
        - Math.sin(-this.toTrigonometricAngle(this.currentOrientation.alpha))
        * this.northIndicatorRadiusOrbit
        * (this.svgMin / 2);
    }
  }

  private setSunIndicatorPosition() {
    if (this.geoPosition) {
      this.sunPosition = this.SunCalc.getPosition(
        this.geoPosition.timestamp,
        this.geoPosition.coords.latitude,
        this.geoPosition.coords.longitude);
      if (this.sunPosition && this.currentOrientation.alpha) {
        const sunAngle = 3 / 2 * Math.PI + this.toRadians(this.currentOrientation.alpha) - this.sunPosition.azimuth;
        this.sunIndicatorX = this.svgWidth / 2
          + Math.cos(-sunAngle)
          * Math.cos(this.sunPosition.altitude)
          * this.sunIndicatorRadiusOrbit
          * (this.svgMin / 2);
        this.sunIndicatorY = this.svgHeight / 2
          + Math.sin(-sunAngle)
          * Math.cos(this.sunPosition.altitude)
          * this.sunIndicatorRadiusOrbit
          * (this.svgMin / 2);
      }
    }
  }

  private setShadows() {
    // this.shadows = new Array<Shadow>();
    // for (let index = 0; index < this.duration; index++) {
    //   this.shadows.push(this.createShadow());
    // }
  }

  private createShadow(): Shadow {
    const shadow = new Shadow();
    const shadowLength: number = .5;
    shadow.centerX = this.svgWidth / 2;
    shadow.centerY = this.svgHeight / 2 + shadowLength / 2;
    shadow.radiusX = this.objectRadius;
    shadow.radiusY = shadowLength / 2;
    return shadow;
  }

  private toTrigonometricAngle(angle: number): number {
    return 3 * Math.PI / 2 - this.toRadians(angle);
  }

  private toRadians(angle: number): number {
    return angle * (Math.PI / 180);
  }
}

