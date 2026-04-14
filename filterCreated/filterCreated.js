import { LightningElement, track, wire } from 'lwc';
import { getObjectInfo, getPicklistValuesByRecordType } from 'lightning/uiObjectInfoApi';
import OPPORTUNITY_OBJECT from '@salesforce/schema/Opportunity';

export default class FilterCreated extends LightningElement {

    @track fieldOptions = [];
    @track filterRows = [];
    @track appliedFilters = []; 

    fieldDataTypes = {};
    allPicklistOptions;
    masterRecordTypeId;
    showSaveButton = false;

    
    @wire(getObjectInfo, { objectApiName: OPPORTUNITY_OBJECT })
    objectInfo({ data }) {
        if (data) {
            this.masterRecordTypeId = data.defaultRecordTypeId;

            this.fieldOptions = Object.keys(data.fields).map(key => ({
                label: data.fields[key].label,
                value: data.fields[key].apiName
            }));

            Object.keys(data.fields).forEach(key => {
                this.fieldDataTypes[data.fields[key].apiName] = data.fields[key].dataType;
            });
        }
    }

    
    @wire(getPicklistValuesByRecordType, {
        objectApiName: OPPORTUNITY_OBJECT,
        recordTypeId: '$masterRecordTypeId'
    })
    picklistData({ data }) {
        if (data) {
            this.allPicklistOptions = data.picklistFieldValues;
        }
    }

    
    handleAddFilter() {
        this.filterRows = [
            ...this.filterRows,
            {
                id: Date.now().toString(),
                selectedField: '',
                selectedOperator: '',
                selectedValue: '',
                operatorOptions: [],
                isOperatorDisabled: true,
                isPicklist: false,
                picklistOptions: []
            }
        ];

        this.showSaveButton = true;
    }

    
    handleRemoveRow(event) {
        const id = event.target.dataset.id;

        this.filterRows = this.filterRows.filter(row => row.id != id);

        if (this.filterRows.length === 0) {
            this.showSaveButton = false;
        }
    }

   
    handleRowChange(event) {
        const id = event.target.dataset.id;
        const name = event.target.name;
        const value = event.target.value;

        this.filterRows = this.filterRows.map(row => {
            if (row.id == id) {

                let updatedRow = { ...row, [name]: value };

                if (name === 'selectedField') {
                    const type = this.fieldDataTypes[value];

                    updatedRow.selectedOperator = '';
                    updatedRow.selectedValue = '';

                    updatedRow.operatorOptions = this.getOperators(type);
                    updatedRow.isOperatorDisabled = false;
                    updatedRow.isPicklist = (type === 'Picklist');

                    updatedRow.picklistOptions =
                        (updatedRow.isPicklist && this.allPicklistOptions?.[value])
                            ? this.allPicklistOptions[value].values.map(opt => ({
                                label: opt.label,
                                value: opt.value
                            }))
                            : [];
                }

                return updatedRow;
            }
            return row;
        });
    }

    
    handleClickSave() {

        const validFilters = this.filterRows.filter(f =>
            f.selectedField && f.selectedOperator && f.selectedValue
        );

        if (validFilters.length === 0) {
            alert('Please fill all filter fields');
            return;
        }

        //HERE  STORING FOR UI (NEW)
        this.appliedFilters = [...validFilters];

        // I AM  SENDING TO PARENT (EXISTING)
        this.dispatchEvent(new CustomEvent('filterselection', {
            detail: { filters: validFilters }
        }));
    }
    

    
    handleRemoveApplied(event) {
        const index = event.target.dataset.index;

        this.appliedFilters.splice(index, 1);
        this.appliedFilters = [...this.appliedFilters];

        // keeping UI in sync
        this.filterRows = [...this.appliedFilters];

        // update parent
        this.dispatchEvent(new CustomEvent('filterselection', {
            detail: { filters: this.appliedFilters }
        }));
    }

    
    handleClearAll() {
        this.appliedFilters = [];
        this.filterRows = [];
        this.showSaveButton = false;

        this.dispatchEvent(new CustomEvent('filterselection', {
            detail: { filters: [] }
        }));
    }

   
    getOperators(type) {

        if (type === 'String' || type === 'Picklist') {
            return [
                { label: 'Equals', value: 'equals' },
                { label: 'Contains', value: 'contains' }
            ];
        }

        if (type === 'Double' || type === 'Currency') {
            return [
                { label: 'Equals', value: 'equals' },
                { label: 'Greater Than', value: 'greater_than' },
                { label: 'Less Than', value: 'less_than' }
            ];
        }

        return [
            { label: 'Equals', value: 'equals' }
        ];
    }
}