package com.ninho.category;

import com.ninho.category.dto.CategoryRequest;
import com.ninho.category.dto.CategoryResponse;
import com.ninho.common.ApiException;
import com.ninho.transaction.TransactionRepository;
import com.ninho.user.User;
import com.ninho.user.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;
    private final TransactionRepository transactionRepository;

    public CategoryService(
            CategoryRepository categoryRepository,
            UserRepository userRepository,
            TransactionRepository transactionRepository
    ) {
        this.categoryRepository = categoryRepository;
        this.userRepository = userRepository;
        this.transactionRepository = transactionRepository;
    }

    @Transactional(readOnly = true)
    public List<CategoryResponse> list(Long userId) {
        return categoryRepository.findByUserIdOrderByNameAsc(userId).stream()
                .map(CategoryResponse::from)
                .toList();
    }

    @Transactional
    public CategoryResponse create(Long userId, CategoryRequest request) {
        if (categoryRepository.existsByUserIdAndNameIgnoreCase(userId, request.name())) {
            throw ApiException.conflict("Ja existe uma categoria com este nome");
        }
        User user = userRepository.getReferenceById(userId);
        Category category = new Category();
        category.setName(request.name().trim());
        category.setColor(request.color());
        category.setUser(user);
        return CategoryResponse.from(categoryRepository.save(category));
    }

    @Transactional
    public CategoryResponse update(Long userId, Long id, CategoryRequest request) {
        Category category = requireOwned(userId, id);
        if (categoryRepository.existsByUserIdAndNameIgnoreCaseAndIdNot(userId, request.name(), id)) {
            throw ApiException.conflict("Ja existe uma categoria com este nome");
        }
        category.setName(request.name().trim());
        category.setColor(request.color());
        return CategoryResponse.from(category);
    }

    @Transactional
    public void delete(Long userId, Long id) {
        Category category = requireOwned(userId, id);
        if (transactionRepository.existsByCategoryId(category.getId())) {
            throw ApiException.conflict("Categoria em uso por transacoes");
        }
        categoryRepository.delete(category);
    }

    public Category requireOwned(Long userId, Long id) {
        return categoryRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> ApiException.notFound("Categoria nao encontrada"));
    }

    @Transactional
    public void seedDefaults(User user) {
        createIfMissing(user, "Alimentacao", "#2F6B4F");
        createIfMissing(user, "Moradia", "#1F4E3D");
        createIfMissing(user, "Transporte", "#C4A35A");
        createIfMissing(user, "Saude", "#6B8F71");
        createIfMissing(user, "Lazer", "#8C6A3C");
        createIfMissing(user, "Salario", "#3D6B58");
    }

    private void createIfMissing(User user, String name, String color) {
        if (categoryRepository.existsByUserIdAndNameIgnoreCase(user.getId(), name)) {
            return;
        }
        Category category = new Category();
        category.setName(name);
        category.setColor(color);
        category.setUser(user);
        categoryRepository.save(category);
    }
}
