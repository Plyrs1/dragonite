import { Tags } from '#lib/types/AnalyticsSchema';
import type { Point } from '@influxdata/influxdb-client';
import { Listener } from '@sapphire/framework';
import { envParseBoolean } from '@skyra/env-utilities';
import type { ClientEvents } from 'discord.js';

export abstract class AnalyticsListener<E extends keyof ClientEvents | symbol = ''> extends Listener<E> {
  public tags: [Tags, string][] = [];

  public constructor(context: Listener.Context, options?: AnalyticsListener.Options) {
    super(context, { ...options, enabled: envParseBoolean('INFLUX_ENABLED') });
  }

  public override onLoad() {
    this.initTags();
    return super.onLoad();
  }

  public writePoint(point: Point) {
    return this.container.analytics!.writeApi.writePoint(this.injectTags(point));
  }

  public writePoints(points: Point[]) {
    points = points.map((point) => this.injectTags(point));
    return this.container.analytics!.writeApi.writePoints(points);
  }

  protected injectTags(point: Point) {
    for (const tag of this.tags) {
      point.tag(tag[0], tag[1]);
    }
    return point;
  }

  protected initTags() {
    this.tags.push([Tags.Client, process.env.CLIENT_ID], [Tags.OriginEvent, this.event as string]);
  }
}

export namespace AnalyticsListener {
  export type Options = Omit<Listener.Options, 'enabled'>;
}
