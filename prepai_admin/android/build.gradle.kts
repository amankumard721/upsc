buildscript {
    repositories {
        google()
        mavenCentral()
    }
    dependencies {
        classpath("com.android.tools.build:gradle:8.2.1")
    }
}

allprojects {
    repositories {
        google()
        mavenCentral()
    }
}

val newBuildDir: Directory =
    rootProject.layout.buildDirectory
        .dir("../../build")
        .get()
rootProject.layout.buildDirectory.value(newBuildDir)

subprojects {
    val newSubprojectBuildDir: Directory = newBuildDir.dir(project.name)
    project.layout.buildDirectory.value(newSubprojectBuildDir)
}

subprojects {
    project.evaluationDependsOn(":app")
}

subprojects {
    val forceCompileSdk = Action<Project> {
        val extension = extensions.findByName("android")
        if (extension != null) {
            val android = extension as? com.android.build.gradle.BaseExtension
            android?.compileSdkVersion(36)
        }
    }
    if (state.executed) {
        forceCompileSdk.execute(this)
    } else {
        afterEvaluate {
            forceCompileSdk.execute(this)
        }
    }
}

tasks.register<Delete>("clean") {
    delete(rootProject.layout.buildDirectory)
}
