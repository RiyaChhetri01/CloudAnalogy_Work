import { LightningElement, wire, track } from 'lwc';
import getOpportunity from '@salesforce/apex/HandlerforLWc.getOpportunity';
import deleteOpp from '@salesforce/apex/HandlerforLWc.deleteOpportunity';
import { refreshApex } from '@salesforce/apex';

export default class Task2AddingFilter extends LightningElement {

    @track opportunities = [];
    @track filteredData = [];
    @track paginatedData = [];
    @track showFilters = false;
    @track activeFilterRows = [];

    currentPage = 1;
    pageSize = 5;
    totalPages = 1;
    searchKey = '';
    wiredResult;

    /*get resultClass() {
        return this.showFilters ? "slds-col slds-size_4-of-12" : "slds-col slds-size_12-of-12";
    }*/

    @wire(getOpportunity)
    wiredOpportunities(result) {
        this.wiredResult = result;
        if (result.data) {
            this.opportunities = result.data.map(opp => ({
                ...opp,
                isEdit: opp.isEdit || false, // Preserve edit state if refresh happens during edit
                accountName: opp.Account ? opp.Account.Name : '',
                AccountId: opp.AccountId
            }));
            this.applyAllFilters();
        }
    }

    handleSearch(event) {
    const value = event.target.value.toLowerCase();

    
    if (value.length >= 3) {
        this.searchKey = value;
    } else {
        this.searchKey = ''; // reset
    }

    this.applyAllFilters();
}

    handleFilterChange(event) {
        this.activeFilterRows = event.detail.filters;
        this.applyAllFilters();
    }

    applyAllFilters() {
        let temp = [...this.opportunities];

        if (this.searchKey) {
            temp = temp.filter(opp =>
                (opp.Name || '').toLowerCase().includes(this.searchKey)
            );
        }

        if (this.activeFilterRows.length) {
            temp = temp.filter(opp =>
                this.activeFilterRows.every(f => this.matchFilter(opp, f))
            );
        }

        this.filteredData = temp;
        this.updatePagination();
    }

    matchFilter(opp, filter) {
        let fieldValue = (filter.selectedField === 'AccountId')
            ? opp.accountName
            : opp[filter.selectedField];

        const val = String(fieldValue || '').toLowerCase();
        const target = String(filter.selectedValue).toLowerCase();

        switch (filter.selectedOperator) {
            case 'equals': return val === target;
            case 'contains': return val.includes(target);
            case 'greater_than': return parseFloat(val) > parseFloat(target);
            case 'less_than': return parseFloat(val) < parseFloat(target);
            default: return true;
        }
    }

    updatePagination() {
        this.totalPages = Math.ceil(this.filteredData.length / this.pageSize) || 1;
        const start = (this.currentPage - 1) * this.pageSize;
        this.paginatedData = this.filteredData.slice(start, start + this.pageSize);
    }

    handleAction(event) {
        const { action, id } = event.detail;

        if (action === 'edit') {
            this.opportunities = this.opportunities.map(r =>
                r.Id === id ? { ...r, isEdit: true } : r
            );
            this.applyAllFilters();
        }

        if (action === 'delete') {
            deleteOpp({ oppId: id })
                .then(() => refreshApex(this.wiredResult))
                .catch(error => console.error('Delete Error:', error));
        }
    }

    handleCancel(event) {
        const id = event.detail.id;
        this.opportunities = this.opportunities.map(r =>
            r.Id === id ? { ...r, isEdit: false } : r
        );
        this.applyAllFilters();
    }

    handleSaveSuccess(event) {
        const savedId = event.detail.id;
        
        //Turn off edit mode for the saved record
        this.opportunities = this.opportunities.map(opp => 
            opp.Id === savedId ? { ...opp, isEdit: false } : opp
        );

        // Refresh data from server
        refreshApex(this.wiredResult).then(() => {
            this.applyAllFilters();
        });
    }

    handlePrevious() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.updatePagination();
        }
    }

    handleNext() {
        if (this.currentPage < this.totalPages) {
            this.currentPage++;
            this.updatePagination();
        }
    }

    handleClickToggle() {
        this.showFilters = !this.showFilters;
    }
}