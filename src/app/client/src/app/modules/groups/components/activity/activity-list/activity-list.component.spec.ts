import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ActivityListComponent } from './activity-list.component';
import { SharedModule, ResourceService, ToasterService } from '@sunbird/shared';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { CoreModule } from '@sunbird/core';
import { TelemetryModule } from '@sunbird/telemetry';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { SuiModule } from 'ng2-semantic-ui';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { mockActivityList } from './activity-list.component.data.spec';
import { GroupsService } from '../../../services/groups/groups.service';
import * as _ from 'lodash-es';

describe('ActivityListComponent', () => {
  let component: ActivityListComponent;
  let fixture: ComponentFixture<ActivityListComponent>;
  let router;

  class FakeActivatedRoute {
    queryParamsMock = new BehaviorSubject<any>({});
    paramsMock = new BehaviorSubject<any>({ groupId: 'abcd12322', activityId: 'do_34534' });
    get params() { return this.paramsMock.asObservable(); }
    get queryParams() { return this.queryParamsMock.asObservable(); }
    snapshot = {
      params: {},
      data: {
        telemetry: {}
      }
    };
    public changeQueryParams(queryParams) { this.queryParamsMock.next(queryParams); }
    public changeParams(params) { this.paramsMock.next(params); }
  }
  class RouterStub {
    navigate = jasmine.createSpy('navigate');
  }

  const resourceBundle = {
    'messages': {
      'fmsg': {
        'm0085': 'Please wait',
      },
      'smsg': {
        'activityRemove': 'Activity removed from the group successfully'
      },
      'emsg': {
        'activityRemove': 'Could not remove activity. Try again later'
      }
    },
    'frmelmnts': {
      'lbl': {}
    }
  };

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ActivityListComponent],
      imports: [SharedModule.forRoot(), HttpClientTestingModule, CoreModule, TelemetryModule.forRoot(), SuiModule],
      providers: [
        { provide: ResourceService, useValue: resourceBundle },
        { provide: ActivatedRoute, useClass: FakeActivatedRoute },
        { provide: Router, useClass: RouterStub },
        GroupsService
      ],
      schemas: [NO_ERRORS_SCHEMA]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    router = TestBed.get(Router);
    fixture = TestBed.createComponent(ActivityListComponent);
    component = fixture.componentInstance;
    component.groupData = mockActivityList.groupData;
    component.activityList = mockActivityList.groupData.activitiesGrouped;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call ngOnInit', () => {
    spyOn(component, 'getActivities');
    component.ngOnInit();
    expect(component.showLoader).toBe(true);
    expect(component.getActivities).toHaveBeenCalled();

  });

  it('should call getActivities', () => {
    spyOn(component['groupService'], 'getActivityList').and.returnValue(
      {showList: false, activities: mockActivityList.groupData.activitiesGrouped});
    component.getActivities();
    expect(component.showLoader).toBe(false);
    expect(component.activityList).toEqual(mockActivityList.groupData.activitiesGrouped);
    expect(component.showActivityList).toBe(false);
  });


  it('should call openActivity for Admin', () => {
    spyOn(component, 'addTelemetry');
    const activity = {
      name: 'Class 5 English',
      identifier: 'do_123523212190',
      appIcon: 'https://ntpproductionall.blob.core.windows.net/ntp-content-production/content/do_3129265279296552961416/artifact/book_2_1491393340123.thumb_1577945304197.png',
      organisation: ['Pre-prod Custodian Organization'],
      subject: 'Social Science'
    };
    component.openActivity({}, activity);
    expect(router.navigate).toHaveBeenCalled();
    expect(component.addTelemetry).toHaveBeenCalled();
  });

  it('should call openActivity for group member', () => {
    spyOn(component, 'addTelemetry');
    const activity = {
      name: 'Class 5 English',
      identifier: 'do_123523212190',
      appIcon: 'https://ntpproductionall.blob.core.windows.net/ntp-content-production/content/do_3129265279296552961416/artifact/book_2_1491393340123.thumb_1577945304197.png',
      organisation: ['Pre-prod Custodian Organization'],
      subject: 'Social Science'
    };
    component.groupData.isAdmin = true;
    component.openActivity({}, activity);
    expect(router.navigate).toHaveBeenCalled();
    expect(component.addTelemetry).toHaveBeenCalled();
  });

  it('should call getMenuData', () => {
    component.showMenu = false;
    const eventData = {
      event: {
        stopImmediatePropagation: jasmine.createSpy('stopImmediatePropagation')
      }
    };
    const member = {
      name: 'Footprints without Feet - English Supplementary Reader',
      identifier: 'do_1235232121343',
      appIcon: 'https://ntpproductionall.blob.core.windows.net/ntp-content-production/content/do_3130298331259453441627/artifact/jefp1cc.thumb.jpg',
      organisation: ['Prod Custodian Organization'],
      subject: 'Social Science',
      type: 'Course'
    };
    spyOn(component['groupService'], 'emitMenuVisibility');
    spyOn(component, 'addTelemetry');
    component.getMenuData(eventData, member);
    expect(component.selectedActivity).toEqual(member);
    expect(component.showMenu).toBe(true);
    expect(component.addTelemetry).toHaveBeenCalledWith('activity-kebab-menu-open');
    expect(component['groupService'].emitMenuVisibility).toHaveBeenCalledWith('activity');
  });

  it('should call toggleModal', () => {
    spyOn(component, 'addTelemetry');
    component.toggleModal(true);
    expect(component.showModal).toEqual(true);
    expect(component.addTelemetry).toHaveBeenCalledWith('remove-activity-kebab-menu-btn');
  });

  it('should call toggleModal', () => {
    spyOn(component, 'addTelemetry');
    component.toggleModal();
    expect(component.showModal).toEqual(false);
    expect(component.addTelemetry).toHaveBeenCalledWith('close-remove-activity-popup');
  });

  it('should call removeActivity', () => {
    component.selectedActivity = mockActivityList.groupData.activitiesGrouped[0].items[0].activityInfo;
    spyOn(component['groupService'], 'removeActivities').and.returnValue(of ({}));
    const toasterService = TestBed.get(ToasterService);
    spyOn(component, 'toggleModal');
    spyOn(toasterService, 'success');
    component.removeActivity();
    component['groupService'].removeActivities('4130b072-fb0a-453b-a07b-4c93812c741b',
    {activityIds: ['do_21271200473210880012152']}).subscribe(data => {
      component.activityList = mockActivityList.removedList;
    });
    expect(component.activityList[0].title).toEqual('Course');
    expect(component.activityList[0].items.length).toEqual(3);
    expect(component.toggleModal).toHaveBeenCalled();
    expect(toasterService.success).toHaveBeenCalled();
  });

  it('should throw error on removeActivity', () => {
    component.selectedActivity = mockActivityList.groupData.activitiesGrouped[0].items[0].activityInfo;
    spyOn(component['groupService'], 'removeActivities').and.returnValue(throwError ({}));
    const toasterService = TestBed.get(ToasterService);
    spyOn(toasterService, 'error');
    component.removeActivity();
    component['groupService'].removeActivities('4130b072-fb0a-453b-a07b-4c93812c741b',
    {activityIds: ['do_21271200473210880012152']}).subscribe(data => {
    }, err => {
      expect(toasterService.error).toHaveBeenCalledWith(resourceBundle.messages.emsg.activityRemove);
    });
    expect(component.activityList[0].items.length).toEqual(4);
  });

  it('should call ngOnDestroy', () => {
    component.showModal = true;
    component.modal = {
      deny: jasmine.createSpy('deny')
    };
    spyOn(component.unsubscribe$, 'next');
    spyOn(component.unsubscribe$, 'complete');
    component.ngOnDestroy();
    expect(component.unsubscribe$.next).toHaveBeenCalled();
    expect(component.unsubscribe$.complete).toHaveBeenCalled();
    expect(component.modal.deny).toHaveBeenCalled();
  });


});
