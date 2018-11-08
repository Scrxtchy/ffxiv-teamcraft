import { Component } from '@angular/core';
import { ListsFacade } from '../../../modules/list/+state/lists.facade';
import { List } from '../../../modules/list/model/list';
import { combineLatest, concat, Observable, of } from 'rxjs';
import { debounceTime, filter, first, map, switchMap } from 'rxjs/operators';
import { ProgressPopupService } from '../../../modules/progress-popup/progress-popup.service';
import { ListManagerService } from '../../../modules/list/list-manager.service';
import { NzMessageService, NzModalService } from 'ng-zorro-antd';
import { TranslateService } from '@ngx-translate/core';
import { NameQuestionPopupComponent } from '../../../modules/name-question-popup/name-question-popup/name-question-popup.component';
import { Workshop } from '../../../model/other/workshop';
import { WorkshopsFacade } from '../../../modules/workshop/+state/workshops.facade';
import { WorkshopDisplay } from '../../../model/other/workshop-display';
import { TeamsFacade } from '../../../modules/teams/+state/teams.facade';
import { Team } from '../../../model/team/team';
import { MergeListsPopupComponent } from '../merge-lists-popup/merge-lists-popup.component';

@Component({
  selector: 'app-lists',
  templateUrl: './lists.component.html',
  styleUrls: ['./lists.component.less']
})
export class ListsComponent {

  public lists$: Observable<{ communityLists: List[], otherLists: List[] }>;

  public teamsDisplays$: Observable<{ team: Team, lists: List[] }[]>;

  public listsWithWriteAccess$: Observable<List[]>;

  public workshops$: Observable<WorkshopDisplay[]>;

  public workshopsWithWriteAccess$: Observable<WorkshopDisplay[]>;

  public loading$: Observable<boolean>;

  constructor(private listsFacade: ListsFacade, private progress: ProgressPopupService,
              private listManager: ListManagerService, private message: NzMessageService,
              private translate: TranslateService, private dialog: NzModalService,
              private workshopsFacade: WorkshopsFacade, private teamsFacade: TeamsFacade) {
    this.workshops$ = combineLatest(this.workshopsFacade.myWorkshops$, this.listsFacade.compacts$).pipe(
      debounceTime(100),
      map(([workshops, compacts]) => {
        return workshops
          .map(workshop => {
            return {
              workshop: workshop,
              lists: workshop.listIds
                .map(key => {
                  const list = compacts.find(c => c.$key === key);
                  if (list !== undefined) {
                    list.workshopId = workshop.$key;
                  }
                  return list;
                })
                .filter(l => l !== undefined)
            };
          })
          .sort((a, b) => a.workshop.index - b.workshop.index);
      })
    );

    this.workshopsWithWriteAccess$ = combineLatest(this.workshopsFacade.workshopsWithWriteAccess$, this.listsFacade.compacts$).pipe(
      debounceTime(100),
      map(([workshops, compacts]) => {
        return workshops
          .map(workshop => {
            return {
              workshop: workshop,
              lists: workshop.listIds
                .map(key => {
                  const list = compacts.find(c => c.$key === key);
                  if (list !== undefined) {
                    list.workshopId = workshop.$key;
                  }
                  return list;
                })
                .filter(l => l !== undefined)
            };
          });
      })
    );

    this.teamsDisplays$ = this.teamsFacade.myTeams$.pipe(
      switchMap(teams => {
        if (teams.length === 0) {
          return of([]);
        }
        return combineLatest(teams.map(team => this.listsFacade.getTeamLists(team).pipe(
          map(lists => {
            return { team: team, lists: lists };
          })
        )));
      })
    );

    this.lists$ = combineLatest(this.listsFacade.myLists$, this.workshops$, this.workshopsWithWriteAccess$, this.teamsDisplays$).pipe(
      debounceTime(100),
      map(([lists, myWorkshops, workshopsWithWriteAccess, teamDisplays]: [List[], WorkshopDisplay[], WorkshopDisplay[], any[]]) => {
        const workshops = [...myWorkshops, ...workshopsWithWriteAccess];
        // lists category shows only lists that have no workshop.
        return lists
          .filter(l => {
            return workshops.find(w => w.workshop.listIds.indexOf(l.$key) > -1) === undefined
              && teamDisplays.find(td => td.lists.find(tl => tl.$key === l.$key) !== undefined) === undefined;
          })
          .map(l => {
            delete l.workshopId;
            return l;
          });
      }),
      map(lists => lists.sort((a, b) => b.index - a.index)),
      map(lists => {
        return {
          communityLists: lists.filter(l => l.public),
          otherLists: lists.filter(l => !l.public)
        };
      })
    );
    this.listsWithWriteAccess$ = this.listsFacade.listsWithWriteAccess$.pipe(
      debounceTime(100)
    );
    this.loading$ = this.listsFacade.loadingMyLists$;

    this.teamsFacade.loadMyTeams();
  }

  createList(): void {
    this.listsFacade.createEmptyList();
  }

  createWorkshop(): void {
    this.dialog.create({
      nzContent: NameQuestionPopupComponent,
      nzFooter: null,
      nzTitle: this.translate.instant('WORKSHOP.Add_workshop')
    }).afterClose.pipe(
      filter(name => name !== undefined),
      map(name => {
        const workshop = new Workshop();
        workshop.name = name;
        return workshop;
      }),
      first()
    ).subscribe((workshop) => {
      this.workshopsFacade.createWorkshop(workshop);
    });
  }

  regenerateLists(lists: { communityLists: List[], otherLists: List[] }): void {
    const regenerations = [...lists.communityLists, ...lists.otherLists].map(list => {
      return this.listManager.upgradeList(list)
        .pipe(
          map(l => this.listsFacade.updateList(l))
        );
    });

    this.progress.showProgress(concat(...regenerations), regenerations.length).pipe(first()).subscribe(() => {
      this.message.success(this.translate.instant('LISTS.Regenerated_all'));
    });
  }

  setListIndex(list: List, index: number, lists: List[]): void {
    if (list.workshopId !== undefined) {
      this.workshopsFacade.removeListFromWorkshop(list.$key, list.workshopId);
    }
    // Remove list from the array
    lists = lists.filter(l => l.$key !== list.$key);
    // Insert it at new index
    lists.splice(index, 0, list);
    // Update indexes and persist
    lists
      .filter((l, i) => l.index !== i)
      .map((l, i) => {
        l.index = i;
        return l;
      })
      .forEach(l => {
        this.listsFacade.updateListIndex(l);
      });

  }

  setWorkshopIndex(workshop: Workshop, index: number, workshopDisplays: WorkshopDisplay[]): void {
    // Remove workshop from the array
    const workshops = workshopDisplays
      .map(display => display.workshop)
      .filter(w => w.$key !== workshop.$key);
    // Insert it at new index
    workshops.splice(index, 0, workshop);
    // Update indexes and persist
    workshops
      .filter((w, i) => w.index !== i)
      .map((w, i) => {
        w.index = i;
        return w;
      })
      .forEach(w => {
        this.workshopsFacade.updateWorkshop(w);
      });
  }

  openMergeDialog(): void {
    this.dialog.create({
      nzTitle: this.translate.instant('LISTS.Merge_lists'),
      nzContent: MergeListsPopupComponent,
      nzFooter: null
    });
  }

  trackByList(index: number, list: List): string {
    return list.$key;
  }

  trackByTeam(index: number, team: Team): string {
    return team.$key;
  }
}
