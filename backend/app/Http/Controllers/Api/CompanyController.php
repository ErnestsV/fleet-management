<?php

namespace App\Http\Controllers\Api;

use App\Domain\Companies\Models\Company;
use App\Domain\Companies\Services\CompanyService;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCompanyRequest;
use App\Http\Requests\UpdateCompanyRequest;
use App\Http\Resources\CompanyResource;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class CompanyController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        $this->authorize('viewAny', Company::class);

        return CompanyResource::collection(Company::query()->latest()->paginate());
    }

    public function store(StoreCompanyRequest $request, CompanyService $service): CompanyResource
    {
        $company = $service->createCompanyWithOwner(
            companyData: $request->safe()->except('owner'),
            ownerData: $request->validated('owner'),
        );

        return new CompanyResource($company);
    }

    public function update(UpdateCompanyRequest $request, Company $company, CompanyService $service): CompanyResource
    {
        return new CompanyResource($service->updateCompany($company, $request->validated()));
    }
}
