import { Action } from '@ngrx/store';

export enum EorzeaActionTypes {
  SetZone = '[Eorzea] Set Zone',
  SetMap = '[Eorzea] Set Map',
  SetWeather = '[Eorzea] Set Weather',
  SetBait = '[Eorzea] Set Bait',
  RemoveStatus = '[Eorzea] Remove Status',
  AddStatus = '[Eorzea] Add Status',
  SetStatuses = '[Eorzea] Set Statuses',
}

export class SetZone implements Action {
  readonly type = EorzeaActionTypes.SetZone;

  constructor(public payload: number) {
  }
}

export class SetMap implements Action {
  readonly type = EorzeaActionTypes.SetMap;

  constructor(public payload: number) {
  }
}

export class SetWeather implements Action {
  readonly type = EorzeaActionTypes.SetWeather;

  constructor(public payload: number) {
  }
}

export class SetBait implements Action {
  readonly type = EorzeaActionTypes.SetBait;

  constructor(public payload: number) {
  }
}

export class RemoveStatus implements Action {
  readonly type = EorzeaActionTypes.RemoveStatus;

  constructor(public payload: number) {
  }
}

export class AddStatus implements Action {
  readonly type = EorzeaActionTypes.AddStatus;

  constructor(public payload: number) {
  }
}

export class SetStatuses implements Action {
  readonly type = EorzeaActionTypes.SetStatuses;

  constructor(public payload: number[]) {
  }
}

export type EorzeaAction = SetZone | SetMap | SetWeather | SetBait | RemoveStatus | AddStatus | SetStatuses;
