package com.apicollab.platform.core.web;

import com.apicollab.platform.core.domain.ApiTestCase;
import com.apicollab.platform.core.repository.ApiTestCaseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/api-test-cases")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ApiTestCaseController {

    private final ApiTestCaseRepository repository;

    @GetMapping("/api-definition/{apiId}")
    public ResponseEntity<List<ApiTestCase>> getByApi(@PathVariable Long apiId) {
        return ResponseEntity.ok(repository.findByApiDefinitionId(apiId));
    }

    @PostMapping
    public ResponseEntity<ApiTestCase> create(@RequestBody ApiTestCase testCase) {
        return ResponseEntity.ok(repository.save(testCase));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiTestCase> update(@PathVariable Long id, @RequestBody ApiTestCase testCase) {
        ApiTestCase existing = repository.findById(id).orElseThrow();
        existing.setName(testCase.getName());
        existing.setContent(testCase.getContent());
        return ResponseEntity.ok(repository.save(existing));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        repository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
