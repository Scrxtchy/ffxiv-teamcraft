import { AbstractExtractor } from '../abstract-extractor';
import { join } from 'path';
import { map, switchMap } from 'rxjs/operators';
import { combineLatest } from 'rxjs';

export class PatchContentExtractor extends AbstractExtractor {
  protected doExtract(): any {
    const patchContent = require(join(__dirname, '../../../../client/src/assets/data/patch-content.json'));
    this.get('https://xivapi.com/patchlist').pipe(
      switchMap(patchList => {
        return combineLatest(patchList.map(patch => {
          return this.aggregateAllPages(`https://xivapi.com/search?indexes=achievement,action,craftaction,fate,instancecontent,item,leve,placename,bnpcname,enpcresident,quest,status,trait&filters=Patch=${patch.ID}`, undefined, `Patches`)
            .pipe(
              map(pages => {
                return {
                  patchId: patch.ID,
                  content: pages
                };
              })
            );
        }));
      })
    ).subscribe((pages: any[]) => {
      pages.forEach(page => {
        (page.content || []).forEach(entry => {
          patchContent[page.patchId] = patchContent[page.patchId] || {};
          if ((patchContent[page.patchId][entry._] || []).indexOf(entry.ID) === -1) {
            patchContent[page.patchId][entry._] = [...(patchContent[page.patchId][entry._] || []), entry.ID];
          }
        });
      });
    }, null, () => {
      this.persistToJsonAsset('patch-content', patchContent);
      this.done();
    });
  }

  getName(): string {
    return 'patch-content';
  }

}
