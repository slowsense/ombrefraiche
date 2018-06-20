import { Component, Vue, Prop } from 'vue-property-decorator';
import ShadowSimulation from '@/components/ShadowSimulation';
import { PositionHelper } from '@/services/PositionHelper';

@Component({
  components: {
    ShadowSimulation,
  },
})
export default class Home extends Vue {

  public duration: number = 3;

  public get durationAsString(): string {
    return this.duration.toString(); 
  }

  public set durationAsString(value: string) {
    this.duration = Number.parseInt(value);
  }

}
