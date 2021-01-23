import { Injectable } from '@angular/core';
import { switchMap } from 'rxjs/operators';
import { AuthFacade } from '../../../+state/auth.facade';
import { LazyDataService } from '../../../core/data/lazy-data.service';
import {
  BaitsPerFishPerSpotQuery,
  BiteTimesPerFishPerSpotPerBaitQuery,
  BiteTimesPerFishPerSpotQuery,
  EorzeaTimesPerFishPerSpotQuery,
  FishStatisticsPerFishPerSpotQuery,
  HooksetTugsPerFishPerSpotQuery,
  RankingPerFishQuery,
  SpotsPerFishQuery,
  WeathersPerFishPerSpotQuery
} from './fish-data.gql';
import { weatherIndex } from '../../../core/data/sources/weather-index';
import { mapIds } from '../../../core/data/sources/map-ids';

const qOpts = { useInitialLoading: true };

/**
 * A service for querying fish data.
 */
@Injectable()
export class FishDataService {
  constructor(
    private readonly auth: AuthFacade,
    private readonly spotsFishQuery: SpotsPerFishQuery,
    private readonly etimeFishSpotQuery: EorzeaTimesPerFishPerSpotQuery,
    private readonly baitFishSpotQuery: BaitsPerFishPerSpotQuery,
    private readonly hooksFishSpotQuery: HooksetTugsPerFishPerSpotQuery,
    private readonly biteFishSpotQuery: BiteTimesPerFishPerSpotQuery,
    private readonly biteFishSpotBaitQuery: BiteTimesPerFishPerSpotPerBaitQuery,
    private readonly statFishSpotQuery: FishStatisticsPerFishPerSpotQuery,
    private readonly weathersFishSpotQuery: WeathersPerFishPerSpotQuery,
    private readonly rankingFishQuery: RankingPerFishQuery,
    private readonly lazyData: LazyDataService
  ) {
  }

  private getPossibleWeathers(spotId: number): number[] {
    // We don't have the list of possible weathers in diadem, so we just return every single weather id, not a too long list ^^
    if (spotId >= 10000) {
      return Object.keys(this.lazyData.data.weathers).map(key => +key);
    }
    const spot = this.lazyData.data.fishingSpots.find(s => s.id === spotId);
    const weatherRate = mapIds.find(map => map.id === spot.mapId).weatherRate;
    const rates = weatherIndex[weatherRate];
    return (rates || []).map(rate => rate.weatherId);
  }

  /**
   * Creates an observable that contains information about the spots for the given fish.
   *
   * @param fishId The fish id to query for.
   * @returns An apollo result observable containing information about the spots for the given fish.
   */
  public getSpotsByFishId = (fishId: number) => {
    return this.spotsFishQuery.watch({ fishId }, qOpts).valueChanges;
  };

  /**
   * Creates an observable that contains information about hours that a fish can be caught at.
   *
   * @param fishId The fish id to query for.
   * @param spotId The spot id to filter by.
   * @returns An apollo result observable containing information about hours that a fish can be caught at.
   */
  public getHours = (fishId?: number, spotId?: number) => {
    return this.etimeFishSpotQuery.watch({ fishId, spotId }, qOpts).valueChanges;
  };

  /**
   * Creates an observable that contains information about the baits used to catch a fish, and which fishes the given fish is (mooch) bait for.
   *
   * @param fishId The fish id to query for.
   * @param spotId The spot id to filter by.
   * @returns An apollo result observable containing information about the baits used to catch a fish, and which fishes the given fish is (mooch) bait for.
   */
  public getBaitMooches = (fishId?: number, spotId?: number) => {
    return this.baitFishSpotQuery.watch({ fishId, spotId }, qOpts).valueChanges;
  };

  /**
   * Creates an observable that contains information about the hooksets and tugs used to catch the given fish.
   *
   * @param fishId The fish id to query for.
   * @param spotId The spot id to filter by.
   * @returns An apollo result observable containing information about the hooksets and tugs used to catch the given fish.
   */
  public getHooksets = (fishId?: number, spotId?: number) => {
    return this.hooksFishSpotQuery.watch({ fishId, spotId }, qOpts).valueChanges;
  };

  /**
   * Creates an observable that contains information about bite times for the given fish.
   *
   * @param fishId The fish id to query for.
   * @param spotId The spot id to filter by.
   * @param baitId The bait id to filter by.
   * @returns An apollo result observable containing information about bite times for the given fish.
   */
  public getBiteTimesByBait = (fishId?: number, spotId?: number, baitId?: number) => {
    return this.biteFishSpotBaitQuery.watch({ fishId, spotId, baitId }, qOpts).valueChanges;
  };

  /**
   * Creates an observable that contains information about bite times for the given fish.
   *
   * @param fishId The fish id to query for.
   * @param spotId The spot id to filter by.
   * @returns An apollo result observable containing information about bite times for the given fish.
   */
  public getBiteTimes = (fishId?: number, spotId?: number) => {
    return this.biteFishSpotQuery.watch({ fishId, spotId }, qOpts).valueChanges;
  };

  /**
   * Creates an observable that contains aggregate statistics about the given fish.
   *
   * @param fishId The fish id to query for.
   * @param spotId The spot id to filter by.
   * @returns An apollo result observable containing aggregate statistics about the given fish.
   */
  public getStatisticsByFishId = (fishId: number, spotId?: number) => {
    return this.statFishSpotQuery.watch({ fishId, spotId }, qOpts).valueChanges;
  };

  /**
   * Creates an observable that contains information about the weathers a fish can be caught during.
   *
   * @param fishId The fish id to query for.
   * @param spotId The spot id to filter by.
   * @returns An apollo result observable containing information about the weathers a fish can be caught during.
   */
  public getWeather = (fishId?: number, spotId?: number) => {
    const params: any = { fishId, spotId };
    if (spotId && spotId < 10000) {
      params.weatherIds = this.getPossibleWeathers(spotId);
    }
    return this.weathersFishSpotQuery.watch(params, qOpts).valueChanges;
  };

  /**
   * Creates an observable that contains information about user statistics for the given fish.
   *
   * @param fishId The fish id to query for.
   * @returns An apollo result observable containing information about user statistics for the given fish.
   */
  public getRankingByFishId = (fishId: number) => {
    return this.auth.userId$.pipe(switchMap((userId) => this.rankingFishQuery.watch({ fishId, userId }, qOpts).valueChanges));
  };
}
